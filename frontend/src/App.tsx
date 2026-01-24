import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/Home';
import { ExplorePage } from './pages/Explore';
import { CampaignPage } from './pages/Campaign';
import { CreatePage } from './pages/Create';
import { MyCampaignsPage } from './pages/MyCampaigns';

function App() {
  return (
    <Layout>
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
