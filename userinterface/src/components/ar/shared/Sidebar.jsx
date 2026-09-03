import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarMenuLinks } from "../../../assets/assets";

import logo from '../../../assets/images/logo.png'
import { MdExpandCircleDown } from "react-icons/md";


function Sidebar() {
    const [expandedItems, setExpandedItems] = useState({});
    const location = useLocation();

    const toggleSubMenu = (index) => {
        setExpandedItems((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    return (
        
        <aside
            dir="rtl"
            className="
            fixed
            right-0
            top-0
            h-screen
            w-16
            sm:w-64
            
            bg-gradient-to-b from-[#f8f7f5] to-[#a47d52]
            border-l
            border-[#e9e6e1]
            shadow-[0_0_15px_rgba(0,0,0,0.3)]
            z-50
            overflow-y-auto
        "
        >

            {/* Logo / Title */}
            <div
                className="
                    flex flex-col items-center justify-center
                    h-24
                    border-b border-[#e9e6e1]
                    px-2
                    mt-15
                    bg-gradient-to-r from-[#a47d52]/5 via-transparent to-[#a47d52]/5
                "
            >

                <img
                    src={logo}
                    alt="Logo"
                    className="
                        mx-auto
                        w-16
                        h-16
                        object-contain
                        
                        rounded-xl
                        
                        p-1
                        transition-transform
                        hover:scale-105
                        duration-300
                    "
                />
                <p className ='text-[#a47d52] font-extrabold'>BROKER CITY</p>
                <p className ='text-[#a47d52] font-extrabold'>PROPERTIES</p>
            </div>


            {/* Sidebar Menu */}
            <nav className="p-2 sm:p-4 mt-2">

                <ul className="space-y-1.5">

                    {SidebarMenuLinks.map((item, index) => {

                        const Icon = item.icon;

                        const isActive =
                            location.pathname === item.path;

                        const isExpanded =
                            expandedItems[index] ??
                            item.isExpanded ??
                            false;


                        return (
                            <li key={index}>

                                {/* Main Item */}
                                {item.subItems ? (

                                    <button
                                        onClick={() => toggleSubMenu(index)}
                                        className={`
                                            w-full
                                            flex items-center
                                            justify-center sm:justify-between
                                            px-3 sm:px-4
                                            py-3
                                            rounded-xl
                                            transition-all
                                            duration-200
                                            font-extrabold
                                            text-sm sm:text-base
                                            shadow-sm
                                            hover:shadow-md

                                            ${
                                                isExpanded
                                                    ? "bg-gradient-to-r from-[#a47d52] to-[#b88d63] text-white shadow-md"
                                                    : "text-[#5a4a3a] hover:bg-[#e9e6e1] hover:text-[#a47d52]"
                                            }
                                        `}
                                    >

                                        <div
                                            className="
                                                flex items-center
                                                gap-3
                                                justify-center
                                                sm:justify-start
                                            "
                                        >

                                            <Icon 
                                                size={20} 
                                                className={`
                                                    ${isExpanded ? "text-white" : "text-[#a47d52]"}
                                                    transition-colors
                                                    duration-200
                                                `}
                                            />

                                            {/* Hidden on mobile */}
                                            <span className="hidden sm:block font-extrabold">
                                                {item.name}
                                            </span>

                                        </div>


                                        {/* Expand/Collapse Icon - MdExpandCircleDown */}
                                        <span className="hidden sm:block">
                                            <MdExpandCircleDown 
                                                size={24}
                                                className={`
                                                    transition-transform
                                                    duration-300
                                                    
                                                    ${isExpanded ? "rotate-180" : "rotate-0"}
                                                    ${isExpanded ? "text-white" : "text-[#a47d52]"}
                                                `}
                                            />
                                        </span>

                                    </button>

                                ) : (

                                    <Link
                                        to={item.path}
                                        className={`
                                            flex items-center
                                            justify-center sm:justify-start
                                            gap-3
                                            px-3 sm:px-4
                                            py-3
                                            rounded-xl
                                            transition-all
                                            duration-200
                                            font-extrabold
                                            text-sm sm:text-xl
                                            shadow-sm
                                            hover:shadow-md

                                            ${
                                                isActive
                                                    ? "bg-gradient-to-r from-[#a47d52] to-[#b88d63] text-white shadow-md"
                                                    : "text-[#5a4a3a] hover:bg-[#e9e6e1] hover:text-[#a47d52]"
                                            }
                                        `}
                                    >

                                        <Icon 
                                            size={20}
                                            className={`
                                                ${isActive ? "text-white" : "text-[#a47d52]"}
                                                transition-colors
                                                duration-200
                                            `}
                                        />

                                        {/* Hidden on mobile */}
                                        <span className="text-xl hidden sm:block font-extrabold">
                                            {item.name}
                                        </span>

                                    </Link>

                                )}


                                {/* Sub Items */}
                                {item.subItems && isExpanded && (

                                    <ul
                                        className="
                                            mt-2
                                            mr-2 sm:mr-6
                                            space-y-1
                                            border-r-2
                                            border-[#a47d52]/30
                                            pr-2 sm:pr-4
                                            bg-gradient-to-l from-[#a47d52]/5 to-transparent
                                            rounded-l-xl
                                            
                                            py-1
                                        "
                                    >

                                        {item.subItems.map(
                                            (subItem, subIndex) => {

                                                const SubIcon = subItem.icon;

                                                const isSubActive =
                                                    location.pathname ===
                                                    subItem.path;


                                                return (
                                                    <li key={subIndex} className ='shadow-lg'>

                                                        <Link
                                                            to={subItem.path}
                                                            className={`
                                                                flex items-center
                                                                justify-center sm:justify-start
                                                                gap-3
                                                                px-2 sm:px-4
                                                                py-2.5
                                                                rounded-lg
                                                                text-xs sm:text-sm
                                                                transition-all
                                                                duration-200
                                                                font-extrabold

                                                                ${
                                                                    isSubActive
                                                                        ? "bg-gradient-to-r from-[#a47d52] to-[#b88d63] text-white shadow-md"
                                                                        : "text-[#6a5a4a] hover:bg-[#e9e6e1] hover:text-[#a47d52] hover:shadow-sm"
                                                                }
                                                            `}
                                                        >

                                                            <SubIcon 
                                                                size={16}
                                                                className={`
                                                                    ${isSubActive ? "text-white" : "text-[#a47d52]"}
                                                                    transition-colors
                                                                    duration-200
                                                                `}
                                                            />

                                                            {/* Hidden on mobile */}
                                                            <span className="hidden sm:block font-extrabold ">
                                                                {subItem.name}
                                                            </span>

                                                        </Link>

                                                    </li>
                                                );

                                            }
                                        )}

                                    </ul>

                                )}

                            </li>
                        );

                    })}

                </ul>

            </nav>

        </aside>
    );
}

export default Sidebar;


// import { useState } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { SidebarMenuLinks } from "../../../assets/assets";

// import logo from '../../../assets/images/logo.png'
// import { MdExpandCircleDown } from "react-icons/md";


// function Sidebar() {
//     const [expandedItems, setExpandedItems] = useState({});
//     const location = useLocation();

//     const toggleSubMenu = (index) => {
//         setExpandedItems((prev) => ({
//             ...prev,
//             [index]: !prev[index],
//         }));
//     };

//     return (
        
//         <aside
//             dir="rtl"
//             className="
//             fixed
//             right-0
//             top-0
//             h-screen
//             w-16
//             sm:w-64
//             bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200
//             border-l
//             border-blue-100
//             shadow-[0_0_7px_rgba(0,0,0,0.4)]
//             z-50
//         "
//         >

//             {/* Logo / Title */}
//             <div
//                 className="
//                     flex items-center justify-center
//                     h-20
//                     border-b border-blue-100
//                     px-2
//                     mt-15
                    
                    
//                 "
//             >

//                 <img
//                         src={logo}
//                         alt="Logo"
//                         className="
//                         mx-auto
//                         w-15
//                         h-15
//                         object-contain
//                         mb-4
//                         shadow-[0_0_7px_rgba(0,0,0,0.4)]
//                         rounded-lg
//                     "
//                                     />
//             </div>


//             {/* Sidebar Menu */}
//             <nav className="p-2 sm:p-4 ">

//                 <ul className="space-y-2">

//                     {SidebarMenuLinks.map((item, index) => {

//                         const Icon = item.icon;

//                         const isActive =
//                             location.pathname === item.path;

//                         const isExpanded =
//                             expandedItems[index] ??
//                             item.isExpanded ??
//                             false;


//                         return (
//                             <li key={index}>

//                                 {/* Main Item */}
//                                 {item.subItems ? (

//                                     <button
//                                         onClick={() => toggleSubMenu(index)}
//                                         className={`
//                                             w-full
//                                             flex items-center
//                                             justify-center sm:justify-between
//                                             px-3 sm:px-4
//                                             py-3
//                                             rounded-lg
//                                             transition

//                                             ${
//                                                 isExpanded
//                                                     ? "bg-blue-100 text-blue-700"
//                                                     : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
//                                             }
//                                         `}
//                                     >

//                                         <div
//                                             className="
//                                                 flex items-center
//                                                 gap-3
//                                                 justify-center
//                                                 sm:justify-start
                                                
//                                             "
//                                         >

//                                             <Icon size={20} />

//                                             {/* Hidden on mobile */}
//                                             <span className="hidden sm:block font-medium">
//                                                 {item.name}
//                                             </span>

//                                         </div>


//                                         {/* + / − hidden on mobile */}
//                                         <span className="hidden sm:block text-3xl text-blue-500 shadow-xl">
//                                             {isExpanded ? "−" : "+"}
//                                         </span>

//                                     </button>

//                                 ) : (

//                                     <Link
//                                         to={item.path}
//                                         className={`
//                                             flex items-center
//                                             justify-center sm:justify-start
//                                             gap-3
//                                             px-3 sm:px-4
//                                             py-3
//                                             rounded-lg
//                                             transition
//                                            font-extrabold
//                                             ${
//                                                 isActive
//                                                     ? "bg-blue-200 text-blue-700"
//                                                     : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
//                                             }
//                                         `}
//                                     >

//                                         <Icon size={20} />

//                                         {/* Hidden on mobile */}
//                                         <span className="hidden sm:block font-extrabold text-lg">
//                                             {item.name}
//                                         </span>

//                                     </Link>

//                                 )}


//                                 {/* Sub Items */}
//                                 {item.subItems && isExpanded && (

//                                     <ul
//                                         className="
//                                             mt-2
//                                             mr-1 sm:mr-6
//                                             space-y-1
//                                             border-r-2
//                                             border-blue-200
//                                             pr-1 sm:pr-3
//                                         "
//                                     >

//                                         {item.subItems.map(
//                                             (subItem, subIndex) => {

//                                                 const SubIcon = subItem.icon;

//                                                 const isSubActive =
//                                                     location.pathname ===
//                                                     subItem.path;


//                                                 return (
//                                                     <li key={subIndex}>

//                                                         <Link
//                                                             to={subItem.path}
//                                                             className={`
//                                                                 flex items-center
//                                                                 justify-center sm:justify-start
//                                                                 gap-3
//                                                                 px-2 sm:px-3
//                                                                 py-2
//                                                                 rounded-lg
//                                                                 text-sm
//                                                                 transition font-extrabold

//                                                                 ${
//                                                                     isSubActive
//                                                                         ? "bg-blue-200 text-blue-700"
//                                                                         : "text-gray-600 hover:bg-blue-100 hover:text-blue-700"
//                                                                 }
//                                                             `}
//                                                         >

//                                                             <SubIcon size={16} />

//                                                             {/* Hidden on mobile */}
//                                                             <span className="hidden sm:block font-extrabold">
//                                                                 {subItem.name}
//                                                             </span>

//                                                         </Link>

//                                                     </li>
//                                                 );

//                                             }
//                                         )}

//                                     </ul>

//                                 )}

//                             </li>
//                         );

//                     })}

//                 </ul>

//             </nav>

//         </aside>
//     );
// }

// export default Sidebar;
