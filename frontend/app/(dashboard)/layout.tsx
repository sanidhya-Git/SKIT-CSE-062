import Titlebar from '@/components/Titlebar'
import Sidebar from '@/components/Sidebar'
import Topbar from '@/components/Topbar'
import ChatWidget from '@/components/ChatWidget'
import LeadScorerModal from '@/components/LeadScorerModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="window">
      <Titlebar />
      <div className="app-body">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">
            {children}
          </div>
        </div>
      </div>
      <ChatWidget />
      <LeadScorerModal />
    </div>
  )
}
