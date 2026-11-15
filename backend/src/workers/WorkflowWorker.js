'use strict';

const { Worker } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const StepExecutor = require('./StepExecutor');
const config = require('../config');
const logger = require('../utils/logger');

let worker;

function startWorker() {
  worker = new Worker(
    'workflow-runs',
    async (job) => {
      const { runId, workflowId, orgId, workflowDefinition, input, triggerType } = job.data;
      logger.info({ runId, workflowId, orgId, jobId: job.id, action: 'worker.start' }, 'Processing workflow run');

      await WorkflowRepository.updateRun(runId, orgId, {
        status: 'running',
        startedAt: new Date(),
      });

      const steps = Array.isArray(workflowDefinition?.steps) ? workflowDefinition.steps : [];
      const variables = workflowDefinition?.variables || {};
      const stepOutputs = {};

      let currentStepIds = steps.length > 0 ? [steps[0].id] : [];
      const stepMap = Object.fromEntries(steps.map((s) => [s.id, s]));

      // Simple linear/branching execution
      let error = null;
      let finalStatus = 'completed';

      try {
        // Execute steps in order, respecting `next` pointers
        const visited = new Set();
        const queue = steps.length > 0 ? [steps[0].id] : [];

        while (queue.length > 0) {
          const stepId = queue.shift();
          if (visited.has(stepId)) continue;
          visited.add(stepId);

          const step = stepMap[stepId];
          if (!step) {
            logger.warn({ runId, stepId }, 'Step not found in definition, skipping');
            continue;
          }

          const stepRunId = uuidv4();
          await WorkflowRepository.upsertStepRun({
            id: stepRunId,
            runId,
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: 'running',
            input,
            startedAt: new Date(),
          });

          let stepOutput;
          let stepStatus;
          let stepError = null;
          let retryCount = 0;
          const maxRetries = step.retries || 0;

          while (retryCount <= maxRetries) {
            try {
              const result = await StepExecutor.execute(step, {
                runId,
                orgId,
                input,
                variables,
                stepOutputs,
                triggeredBy: null,
                correlationId: runId,
              });

              stepOutput = result.output;
              stepStatus = result.status;
              stepOutputs[step.id] = stepOutput;
              break;
            } catch (err) {
              retryCount++;
              stepError = err.message;

              if (retryCount > maxRetries) {
                stepStatus = 'failed';
                break;
              }

              logger.warn({ runId, stepId: step.id, retryCount, error: err.message }, 'Step failed, retrying');
              await new Promise((r) => setTimeout(r, 1000 * retryCount));
            }
          }

          await WorkflowRepository.upsertStepRun({
            id: stepRunId,
            runId,
            stepId: step.id,
            stepName: step.name,
            stepType: step.type,
            status: stepStatus,
            input,
            output: stepOutput || null,
            error: stepError,
            startedAt: new Date(),
            completedAt: new Date(),
            retryCount,
          });

          if (stepStatus === 'waiting_approval') {
            // Pause execution — the approval webhook will re-trigger
            await WorkflowRepository.updateRun(runId, orgId, { status: 'running' });
            logger.info({ runId, stepId: step.id }, 'Workflow waiting for approval');
            return { status: 'waiting_approval', stepId: step.id };
          }

          if (stepStatus === 'failed') {
            const onError = step.onError || 'fail';
            if (onError === 'fail') {
              error = stepError || 'Step failed';
              finalStatus = 'failed';
              break;
            } else if (onError === 'skip') {
              logger.warn({ runId, stepId: step.id }, 'Step failed, skipping (onError=skip)');
            }
            // onError=retry is handled above
          }

          // Enqueue next steps
          if (step.next) {
            const nextIds = Array.isArray(step.next) ? step.next : [step.next];
            for (const nextId of nextIds) {
              if (!visited.has(nextId)) queue.push(nextId);
            }
          } else {
            // Follow linear order
            const currentIdx = steps.findIndex((s) => s.id === stepId);
            if (currentIdx >= 0 && currentIdx + 1 < steps.length) {
              const nextStep = steps[currentIdx + 1];
              if (!visited.has(nextStep.id)) queue.push(nextStep.id);
            }
          }
        }
      } catch (err) {
        error = err.message;
        finalStatus = 'failed';
        logger.error({ runId, orgId, err, action: 'worker.error' }, 'Workflow run failed');
      }

      await WorkflowRepository.updateRun(runId, orgId, {
        status: finalStatus,
        completedAt: new Date(),
        error: error || null,
      });

      logger.info({ runId, orgId, status: finalStatus, action: 'worker.complete' }, 'Workflow run complete');
      return { status: finalStatus };
    },
    {
      connection: { url: config.redis.url },
      concurrency: config.bullmq.concurrency,
    }
  );

  worker.on('completed', (job, result) => {
    logger.info({ jobId: job.id, runId: job.data.runId, result }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, runId: job?.data?.runId, error: err.message }, 'Job failed permanently');

    // Mark as dead_letter after all BullMQ retries exhausted
    if (job?.data?.runId) {
      WorkflowRepository.updateRun(job.data.runId, job.data.orgId, {
        status: 'dead_letter',
        completedAt: new Date(),
        error: err.message,
      }).catch((e) => logger.error({ e }, 'Failed to update run to dead_letter'));
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'BullMQ worker error');
  });

  logger.info({ concurrency: config.bullmq.concurrency }, 'BullMQ workflow worker started');
  return worker;
}

async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
    logger.info('BullMQ workflow worker stopped');
  }
}

module.exports = { startWorker, stopWorker };
