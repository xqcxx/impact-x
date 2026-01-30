import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { ExplorePage } from './pages/Explore';
import { CampaignPage } from './pages/Campaign';
import { CreatePage } from './pages/Create';
import { MyCampaignsPage } from './pages/MyCampaigns';

function App() {
  return (
    <Layout>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1918',
            color: '#FAFAF9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          },
          success: {
            iconTheme: {
              primary: '#4ADE80',
              secondary: '#1A1918',
            },
          },
          error: {
            iconTheme: {
              primary: '#F87171',
              secondary: '#1A1918',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/campaign/:id" element={<CampaignPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/my-campaigns" element={<MyCampaignsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
