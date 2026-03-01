/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIInsights from './pages/AIInsights';
import AdminAgreements from './pages/AdminAgreements';
import AdminRiskProfiles from './pages/AdminRiskProfiles';
import AlertSettings from './pages/AlertSettings';
import ClientInfo from './pages/ClientInfo';
import Home from './pages/Home';
import Landing from './pages/Landing';
import MyProfile from './pages/MyProfile';
import ProfileForm from './pages/ProfileForm';
import RiskLevel from './pages/RiskLevel';
import ServiceAgreement from './pages/ServiceAgreement';
import SystemSettings from './pages/SystemSettings';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AdminAgreements": AdminAgreements,
    "AdminRiskProfiles": AdminRiskProfiles,
    "AlertSettings": AlertSettings,
    "ClientInfo": ClientInfo,
    "Home": Home,
    "Landing": Landing,
    "MyProfile": MyProfile,
    "ProfileForm": ProfileForm,
    "RiskLevel": RiskLevel,
    "ServiceAgreement": ServiceAgreement,
    "SystemSettings": SystemSettings,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};