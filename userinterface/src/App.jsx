import { BrowserRouter as Router, Route, Routes } from 'react-router-dom' ;
import MainLayout from "./pages/MainLayout";
import { ToastContainer } from 'react-toastify' ;
import PrivateRouter from './components/PrivateRouter';
import ArLogin from './pages/ar/Login';
import ArDashboard from './pages/ar/Dashboard';
import ArBank from './pages/ar/Bank';
import ArCash from './pages/ar/Cash';
import ArPaymentMethod from './pages/ar/PaymentMethod' ;
import ArTransaction from './pages/ar/Transaction';
import ArAccounts from './pages/ar/Accounts';
import ArWhatsApp from './pages/ar/WhatsApp' ;
// Property Management
import ArOwner from './pages/ar/Owner'
import ArCategory from './pages/ar/Category'
import ArUnit from './pages/ar/Unit'
import ArRental from './pages/ar/Rental' ;
// Website 
import ArWebSiteLink from './pages/ar/WebSiteLink' ;
import ArSlider from './pages/ar/Slider' ;
// Developers
import ArDeveloper from './pages/ar/Developer' ;
import ArDeveloperEmail from './pages/ar/DeveloperEmail' ;

// Sale Offer
import ArSaleOffer from './pages/ar/Developer' ;

import Login from './pages/en/Login'
import Signup from './pages/en/Signup'

import OfferSalesPDF from './pages/OfferSalePdf';

import ArMonitor from './pages/ar/Monitor';
import LeadsStagesGuide from './pages/ar/LeadsStagesGuide';




function App() {
  return (
    <Router>
      <ToastContainer />
      
      <Routes>

      {/* Public pages */}
            <Route path="/ar-login" element={<ArLogin />} />    
            <Route path="/login" element={<Login />}/>
            <Route path="/signup" element={<Signup />}/>
            <Route path="/ar-whatsapp" element={<ArWhatsApp />}/>
                        

      {/* Main Layout */}
            <Route element={<MainLayout />}>

                <Route path="/ar-dashboard" element={<ArDashboard />} />
                <Route path="/ar-bank" element={<ArBank />} />
                <Route path="/ar-cash" element={<ArCash />}/>
                <Route path="/ar-paymethod" element={<ArPaymentMethod />}/>
                <Route path="/ar-accounts" element={<ArAccounts />}/>
                <Route path="/ar-transaction" element={<ArTransaction />}/>

                <Route path="/ar-owner" element={<ArOwner />}/>
                <Route path="/ar-unit" element={<ArUnit />}/>
                <Route path="/ar-category" element={<ArCategory />}/>
                 <Route path="/ar-rentals" element={<ArRental />}/>


                <Route path="/ar-website" element={<ArWebSiteLink />}/>
                <Route path="/ar-slider" element={<ArSlider />}/>

                <Route path="/ar-developer" element={<ArDeveloper />}/>
                {/* /ar-developer-email */}
                <Route path="/ar-developer-email" element={<ArDeveloperEmail />}/>
                
                
                <Route path="/offer-sale" element={<OfferSalesPDF />}/>
                <Route path="/ar-sale-offer" element={<ArSaleOffer />}/>
                <Route path="/leadstagesguide" element={<LeadsStagesGuide />}/>

                 {/* Monitoring */}
                <Route path="/ar-monitor" element={<ArMonitor />}/>
              
            </Route>

      </Routes>
     
    </Router>
  );
}

export default App ;


