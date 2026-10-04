// MainLayout.jsx is exactly where you should combine the Sidebar, Navbar, and the currently selected page.


import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/ar/shared/Navbar";
import Sidebar from "../components/ar/shared/Sidebar";

//import bgImage from '../assets/images/logogo.jpeg' ;
import bgImage from '../assets/images/background.jpg'

const MainLayout = () => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    // Stable callback so Sidebar's useEffect doesn't re-run unnecessarily
    const handleSidebarHover = useCallback((expanded) => {
        setSidebarExpanded(expanded);
    }, []);

    return (
        <div dir="rtl" className="relative min-h-screen">

            {/* ===== FIXED BACKGROUND LAYER ===== */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${bgImage})`,   // ← use the imported variable
                }}
            />

            {/* ===== OPTIONAL TRANSPARENT OVERLAY (for readability) ===== */}
            <div className="fixed inset-0 -z-10 bg-black/40 backdrop-blur-sm" />

            {/* Sidebar */}
            <Sidebar onHoverChange={handleSidebarHover} />

            {/* Main Content Area */}
            <div
                className={`
                    relative
                    transition-all
                    duration-300
                    ease-in-out
                    ${sidebarExpanded ? "mr-64" : "mr-16 sm:mr-14 md:mr-16"}
                `}
            >
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




// import { useState, useCallback } from "react";
// import { Outlet } from "react-router-dom";

// import Navbar from "../components/ar/shared/Navbar";
// import Sidebar from "../components/ar/shared/Sidebar";

// const MainLayout = () => {
//     const [sidebarExpanded, setSidebarExpanded] = useState(false);

//     // Stable callback so Sidebar's useEffect doesn't re-run unnecessarily
//     const handleSidebarHover = useCallback((expanded) => {
//         setSidebarExpanded(expanded);
//     }, []);

//     return (
//         <div dir="rtl" className="min-h-screen">

//             {/* Sidebar */}
//             <Sidebar onHoverChange={handleSidebarHover} />

//             {/* Main Content Area */}
//             <div
//                 className={`
//                     transition-all
//                     duration-300
//                     ease-in-out
//                     ${sidebarExpanded ? "mr-64" : "mr-16 sm:mr-14 md:mr-16"}
//                 `}
//             >

//                 {/* Navbar */}
//                 <Navbar />

//                 {/* Selected Page */}
//                 <main className="pt-12 p-4">
//                     <Outlet />
//                 </main>

//             </div>

//         </div>
//     );
// };

// export default MainLayout;


