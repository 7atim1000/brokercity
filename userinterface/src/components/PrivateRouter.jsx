import {Navigate, Outlet} from 'react-router-dom' ;
import { getAccessToken } from '../utils/auth';

// const isAuthenticated = () => !!localStorage.getItem("access-token");
const isAuthenticated = () => !!getAccessToken();

export default function PrivateRouter({redirectTo = '/login'}) {
    return isAuthenticated()
        ? <Outlet />
        : <Navigate to={redirectTo} replace />
};