import { BrowserRouter as Router, Route, Routes } from 'react-router-dom' ;
import MainLayout from "./pages/MainLayout";
import { ToastContainer } from 'react-toastify' ;
import PrivateRouter from './components/PrivateRouter';
import ArLogin from './pages/ar/Login';
import ArDashboard from './pages/ar/Dashboard';
import ArBank from './pages/ar/Bank';
import ArCash from './pages/ar/Cash';
import  ArPaymentMethod from './pages/ar/PaymentMethod' ;
import ArTransaction from './pages/ar/Transaction';
import ArAccounts from './pages/ar/Accounts';

import Login from './pages/en/Login'
import Signup from './pages/en/Signup'



function App() {
  return (
    <Router>
      <ToastContainer />
      
      <Routes>

      {/* Public pages */}
            <Route path="/ar-login" element={<ArLogin />} />    
            <Route path="/login" element={<Login />}/>
            <Route path="/signup" element={<Signup />}/>
                        

      {/* Main Layout */}
            <Route element={<MainLayout />}>

                <Route path="/ar-dashboard" element={<ArDashboard />} />
                <Route path="/ar-bank" element={<ArBank />} />
                <Route path="/ar-cash" element={<ArCash />}/>
                <Route path="/ar-paymethod" element={<ArPaymentMethod />}/>
                <Route path="/ar-accounts" element={<ArAccounts />}/>
                <Route path="/ar-transaction" element={<ArTransaction />}/>

                

            </Route>

        
      </Routes>
     
    </Router>
  );
}

export default App ;


