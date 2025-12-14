import Layout from "./Layout.jsx";

import Home from "./Home";

import ProfileForm from "./ProfileForm";

import MyProfile from "./MyProfile";

import AlertSettings from "./AlertSettings";

import AIInsights from "./AIInsights";

import ServiceAgreement from "./ServiceAgreement";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    ProfileForm: ProfileForm,
    
    MyProfile: MyProfile,
    
    AlertSettings: AlertSettings,
    
    AIInsights: AIInsights,
    
    ServiceAgreement: ServiceAgreement,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/ProfileForm" element={<ProfileForm />} />
                
                <Route path="/MyProfile" element={<MyProfile />} />
                
                <Route path="/AlertSettings" element={<AlertSettings />} />
                
                <Route path="/AIInsights" element={<AIInsights />} />
                
                <Route path="/ServiceAgreement" element={<ServiceAgreement />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}