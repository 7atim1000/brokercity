// MainLayout.jsx is exactly where you should combine the Sidebar, Navbar, and the currently selected page.
import { Outlet } from "react-router-dom";

import Navbar from "../components/ar/shared/Navbar";
import Sidebar from "../components/ar/shared/Sidebar";

const MainLayout = () => {
    return (
        <div dir="rtl" className="min-h-screen">

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="mr-16 sm:mr-64">

                {/* Navbar */}
                <Navbar />

                {/* Selected Page */}
                <main className="pt-12 p-4">
                    <Outlet />
                </main>

            </div>

        </div>
    );
};

export default MainLayout;