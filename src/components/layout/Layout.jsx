import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { T } from '../../utils/theme';

export function Layout({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={title} subtitle={subtitle} />
        <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
