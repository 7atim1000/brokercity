import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { SidebarMenuLinks } from "../../../assets/assets";

import { MdExpandCircleDown } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { SiGmail } from "react-icons/si";

function Sidebar({ onHoverChange }) {
    const [expandedItems, setExpandedItems] = useState({});
    const [isHovered, setIsHovered] = useState(false);
    const location = useLocation();
    const sidebarRef = useRef(null);

    const toggleSubMenu = (index) => {
        setExpandedItems((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    const [isDesktop, setIsDesktop] = useState(
        typeof window !== "undefined" ? window.innerWidth >= 768 : true
    );

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        onHoverChange?.(isDesktop && isHovered);
    }, [isDesktop, isHovered, onHoverChange]);

    const isExpanded = isDesktop && isHovered;

    const mainLinks = SidebarMenuLinks.filter(
        (item) =>
            item.path !== "/ar-whatsapp" &&
            item.path !== "/email" &&
            item.path !== "/crm" &&
            item.path !== "/ar-website"
    );
    const bottomLinks = SidebarMenuLinks.filter(
        (item) =>
            item.path === "/ar-whatsapp" ||
            item.path === "/email" ||
            item.path === "/crm" ||
            item.path === "/ar-website"
    );

    return (
        <aside
            ref={sidebarRef}
            dir="rtl"
            onMouseEnter={() => isDesktop && setIsHovered(true)}
            onMouseLeave={() => isDesktop && setIsHovered(false)}
            className={`
                fixed
                right-0
                top-5
                h-screen
                border-l
                border-[#8a6a44]/40
                shadow-[0_0_25px_rgba(0,0,0,0.5)]
                z-50
                overflow-hidden
                transition-all
                duration-300
                ease-in-out
                flex
                flex-col
                bg-gradient-to-b from-[#a47d52]/10 via-[#a47d52]/10 to-[#f8f7f5]/90 backdrop-blur-md
                ${isExpanded ? "w-64" : "w-16 sm:w-64 md:w-16"}
            `}
            style={{
                width: isDesktop ? (isHovered ? "16rem" : "4rem") : undefined,
            }}
        >
            {/* Scrollable nav area */}
            <nav className="flex-1 p-2 sm:p-1 pt-15 sm:pt-15 overflow-y-auto overflow-x-hidden ">
                <ul className="space-y-1 ">
                    {mainLinks.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        const isExpandedItem =
                            expandedItems[index] ?? item.isExpanded ?? false;

                        return (
                            <li key={index}>
                                {item.subItems ? (
                                    <button
                                        onClick={() => toggleSubMenu(index)}
                                        className={`
                                            border-b-3 border-[#a47d59]
                                            flex items-center 
                                            ${isExpanded ? "justify-between w-full px-3 py-2.5 rounded-xl" : "justify-center w-10 h-10 mx-auto rounded-full p-0"}
                                            transition-all
                                            duration-300
                                            ease-in-out
                                            font-black
                                            ${isExpanded ? "text-sm sm:text-base" : "text-xs"}
                                            cursor-pointer
                                            group
                                            text-white
                                            ${
                                                isExpandedItem
                                                    ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-lg shadow-[#a47d52]/40"
                                                    : "bg-white/5 hover:bg-white/15 shadow-sm hover:shadow-md"
                                            }
                                        `}
                                    >
                                        <div className={`flex items-center ${isExpanded ? "gap-2" : "gap-0"} justify-center`}>
                                            <Icon
                                                size={isExpanded ? 20 : 18}
                                                strokeWidth={2.5}
                                                className="
                                                    text-white
                                                    drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                                                    transition-all
                                                    duration-300
                                                    shrink-0
                                                "
                                            />
                                            <span
                                                className={`
                                                    font-black
                                                    text-white
                                                    tracking-wide
                                                    whitespace-nowrap
                                                    transition-all
                                                    duration-300
                                                    ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
                                                `}
                                            >
                                                {item.name}
                                            </span>
                                        </div>
                                        <span
                                            className={`
                                                transition-all
                                                duration-300
                                                ${isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
                                            `}
                                        >
                                            <MdExpandCircleDown
                                                size={22}
                                                className={`
                                                    text-white
                                                    transition-transform
                                                    duration-300
                                                    ${
                                                        isExpandedItem
                                                            ? "rotate-180"
                                                            : "rotate-0"
                                                    }
                                                `}
                                            />
                                        </span>
                                    </button>
                                ) : (
                                    <Link
                                        to={item.path}
                                        className={`
                                            border-b-3 border-[#a47d59]
                                            flex items-center
                                            ${isExpanded ? "justify-start w-full gap-2 px-3 py-2.5 rounded-xl text-sm sm:text-base" : "justify-center w-10 h-10 mx-auto rounded-full p-0 gap-0 text-xs"}
                                            transition-all
                                            duration-300
                                            ease-in-out
                                            font-black
                                            group
                                            ${
                                                isActive
                                                    ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-lg shadow-[#a47d52]/40"
                                                    : "bg-white/5 hover:bg-white/15 text-white shadow-sm hover:shadow-md"
                                            }
                                        `}
                                    >
                                        <Icon
                                            size={isExpanded ? 20 : 18}
                                            strokeWidth={1.1}
                                            className="
                                                text-white
                                                drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                                                transition-all
                                                duration-300
                                                shrink-0
                                            "
                                        />
                                        <span
                                            className={`
                                                font-black
                                                tracking-wide
                                                whitespace-nowrap
                                                transition-all
                                                duration-300
                                                text-white
                                                ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
                                            `}
                                        >
                                            {item.name}
                                        </span>
                                    </Link>
                                )}

                                {item.subItems && isExpandedItem && isExpanded && (
                                    <ul
                                        className="
                                            mt-1 mr-1 space-y-1
                                            border-r-2 border-[#d4a574]/40
                                            pr-2
                                            bg-white/5
                                            rounded-l-xl
                                            py-1
                                            animate-[fadeIn_0.2s_ease-in]
                                        "
                                    >
                                        {item.subItems.map((subItem, subIndex) => {
                                            const SubIcon = subItem.icon;
                                            const isSubActive =
                                                location.pathname === subItem.path;
                                            return (
                                                <li key={subIndex}>
                                                    <Link
                                                        to={subItem.path}
                                                        className={`
                                                            flex items-center
                                                            justify-start
                                                            gap-2
                                                            px-3
                                                            py-2
                                                            rounded-lg
                                                            text-xs sm:text-sm
                                                            transition-all
                                                            duration-200
                                                            font-black
                                                            ${
                                                                isSubActive
                                                                    ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-md"
                                                                    : "text-white hover:bg-white/15 hover:shadow-sm"
                                                            }
                                                        `}
                                                    >
                                                        <SubIcon
                                                            size={16}
                                                            strokeWidth={2.5}
                                                            className="
                                                                text-white
                                                                drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
                                                                transition-colors
                                                                duration-200
                                                                shrink-0
                                                            "
                                                        />
                                                        <span className="font-black tracking-wide text-white whitespace-nowrap">
                                                            {subItem.name}
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom pinned section: WhatsApp + Email + CRM + Website */}
            <div className="p-2 space-y-1 pb-15 shrink-0">
                {bottomLinks.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    const isWhatsApp = item.path === "/ar-whatsapp";
                    const isCrm = item.path === "/crm";
                    const isWebsite = item.path === "/website";

                    // Color resolution
                    const iconColor = isWhatsApp
                        ? "text-[#25D366]"
                        : isCrm
                            ? "text-[#1D9BF0]"
                            : isWebsite
                                ? "text-[#4285F4]"
                                : "text-[#EA4335]";

                    const labelColor = isWhatsApp
                        ? "text-[#128C7E]"
                        : isCrm
                            ? "text-[#1D9BF0]"
                            : isWebsite
                                ? "text-[#4285F4]"
                                : "text-[#EA4335]";

                    return (
                        <Link
                            key={index}
                            to={item.path}
                            className={`
                                border-b-3 border-white
                                flex items-center
                                ${isExpanded ? "justify-start w-full gap-2 px-3 py-2.5 rounded-xl text-sm sm:text-base" : "justify-center w-10 h-10 mx-auto rounded-full p-0 gap-0 text-xs"}
                                transition-all
                                duration-300
                                ease-in-out
                                font-black
                                group
                                hover:bg-white/90
                                shadow-sm
                                hover:shadow-md
                            `}
                        >
                            <Icon
                                size={isExpanded ? 20 : 18}
                                strokeWidth={1.1}
                                className={`
                                    shrink-0
                                    transition-all
                                    duration-300
                                    ${iconColor}
                                `}
                            />
                            <span
                                className={`
                                    font-black
                                    tracking-wide
                                    whitespace-nowrap
                                    transition-all
                                    duration-300
                                    ${labelColor}
                                    ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
                                `}
                            >
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </aside>
    );
}

export default Sidebar;



// import { useState, useEffect, useRef } from "react";
// import { Link, useLocation } from "react-router-dom";
// import { SidebarMenuLinks } from "../../../assets/assets";

// import { MdExpandCircleDown } from "react-icons/md";
// import { FaWhatsapp } from "react-icons/fa";
// import { SiGmail } from "react-icons/si";

// function Sidebar({ onHoverChange }) {
//     const [expandedItems, setExpandedItems] = useState({});
//     const [isHovered, setIsHovered] = useState(false);
//     const location = useLocation();
//     const sidebarRef = useRef(null);

//     const toggleSubMenu = (index) => {
//         setExpandedItems((prev) => ({
//             ...prev,
//             [index]: !prev[index],
//         }));
//     };

//     const [isDesktop, setIsDesktop] = useState(
//         typeof window !== "undefined" ? window.innerWidth >= 768 : true
//     );

//     useEffect(() => {
//         const handleResize = () => {
//             setIsDesktop(window.innerWidth >= 768);
//         };
//         window.addEventListener("resize", handleResize);
//         return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     useEffect(() => {
//         onHoverChange?.(isDesktop && isHovered);
//     }, [isDesktop, isHovered, onHoverChange]);

//     const isExpanded = isDesktop && isHovered;

//     const mainLinks = SidebarMenuLinks.filter(
//     (item) =>
//         item.path !== "/ar-whatsapp" &&
//         item.path !== "/email" &&
//         item.path !== "/crm"
// );
// const bottomLinks = SidebarMenuLinks.filter(
//     (item) =>
//         item.path === "/ar-whatsapp" ||
//         item.path === "/email" ||
//         item.path === "/crm"
// );

//     return (
//         <aside
//             ref={sidebarRef}
//             dir="rtl"
//             onMouseEnter={() => isDesktop && setIsHovered(true)}
//             onMouseLeave={() => isDesktop && setIsHovered(false)}
//             className={`
//                 fixed
//                 right-0
//                 top-5
//                 h-screen
//                 bg-gradient-to-b
//                 from-[#a47d52]
//                 via-[#a47d52]
//                 to-[#f8f7f5]
//                 border-l
//                 border-[#8a6a44]/40
//                 shadow-[0_0_25px_rgba(0,0,0,0.5)]
//                 z-50
//                 overflow-hidden
//                 transition-all
//                 duration-300
//                 ease-in-out
//                 flex
//                 flex-col
//                 ${isExpanded ? "w-64" : "w-16 sm:w-64 md:w-16"}
//             `}
//             style={{
//                 width: isDesktop ? (isHovered ? "16rem" : "4rem") : undefined,
//             }}
//         >
//             {/* Scrollable nav area */}
//             <nav className="flex-1 p-2 sm:p-1 pt-15 sm:pt-15 overflow-y-auto overflow-x-hidden">
//                 <ul className="space-y-1">
//                     {mainLinks.map((item, index) => {
//                         const Icon = item.icon;
//                         const isActive = location.pathname === item.path;
//                         const isExpandedItem =
//                             expandedItems[index] ?? item.isExpanded ?? false;

//                         return (
//                             <li key={index}>
//                                 {item.subItems ? (
//                                     <button
//                                         onClick={() => toggleSubMenu(index)}
//                                         className={`
//                                             flex items-center 
//                                             ${isExpanded ? "justify-between w-full px-3 py-2.5 rounded-xl" : "justify-center w-10 h-10 mx-auto rounded-full p-0"}
//                                             transition-all
//                                             duration-300
//                                             ease-in-out
//                                             font-black
//                                             ${isExpanded ? "text-sm sm:text-base" : "text-xs"}
//                                             cursor-pointer
//                                             group
//                                             text-white
//                                             ${
//                                                 isExpandedItem
//                                                     ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-lg shadow-[#a47d52]/40"
//                                                     : "bg-white/5 hover:bg-white/15 shadow-sm hover:shadow-md"
//                                             }
//                                         `}
//                                     >
//                                         <div className={`flex items-center ${isExpanded ? "gap-2" : "gap-0"} justify-center`}>
//                                             <Icon
//                                                 size={isExpanded ? 20 : 18}
//                                                 strokeWidth={2.5}
//                                                 className="
//                                                     text-white
//                                                     drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
//                                                     transition-all
//                                                     duration-300
//                                                     shrink-0
//                                                 "
//                                             />
//                                             <span
//                                                 className={`
//                                                     font-black
//                                                     text-white
//                                                     tracking-wide
//                                                     whitespace-nowrap
//                                                     transition-all
//                                                     duration-300
//                                                     ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
//                                                 `}
//                                             >
//                                                 {item.name}
//                                             </span>
//                                         </div>
//                                         <span
//                                             className={`
//                                                 transition-all
//                                                 duration-300
//                                                 ${isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}
//                                             `}
//                                         >
//                                             <MdExpandCircleDown
//                                                 size={22}
//                                                 className={`
//                                                     text-white
//                                                     transition-transform
//                                                     duration-300
//                                                     ${
//                                                         isExpandedItem
//                                                             ? "rotate-180"
//                                                             : "rotate-0"
//                                                     }
//                                                 `}
//                                             />
//                                         </span>
//                                     </button>
//                                 ) : (
//                                     <Link
//                                         to={item.path}
//                                         className={`
//                                             flex items-center
//                                             ${isExpanded ? "justify-start w-full gap-2 px-3 py-2.5 rounded-xl text-sm sm:text-base" : "justify-center w-10 h-10 mx-auto rounded-full p-0 gap-0 text-xs"}
//                                             transition-all
//                                             duration-300
//                                             ease-in-out
//                                             font-black
//                                             group
//                                             ${
//                                                 isActive
//                                                     ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-lg shadow-[#a47d52]/40"
//                                                     : "bg-white/5 hover:bg-white/15 text-white shadow-sm hover:shadow-md"
//                                             }
//                                         `}
//                                     >
//                                         <Icon
//                                             size={isExpanded ? 20 : 18}
//                                             strokeWidth={1.1}
//                                             className="
//                                                 text-white
//                                                 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
//                                                 transition-all
//                                                 duration-300
//                                                 shrink-0
//                                             "
//                                         />
//                                         <span
//                                             className={`
//                                                 font-black
//                                                 tracking-wide
//                                                 whitespace-nowrap
//                                                 transition-all
//                                                 duration-300
//                                                 text-white
//                                                 ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
//                                             `}
//                                         >
//                                             {item.name}
//                                         </span>
//                                     </Link>
//                                 )}

//                                 {item.subItems && isExpandedItem && isExpanded && (
//                                     <ul
//                                         className="
//                                             mt-1 mr-1 space-y-1
//                                             border-r-2 border-[#d4a574]/40
//                                             pr-2
//                                             bg-white/5
//                                             rounded-l-xl
//                                             py-1
//                                             animate-[fadeIn_0.2s_ease-in]
//                                         "
//                                     >
//                                         {item.subItems.map((subItem, subIndex) => {
//                                             const SubIcon = subItem.icon;
//                                             const isSubActive =
//                                                 location.pathname === subItem.path;
//                                             return (
//                                                 <li key={subIndex}>
//                                                     <Link
//                                                         to={subItem.path}
//                                                         className={`
//                                                             flex items-center
//                                                             justify-start
//                                                             gap-2
//                                                             px-3
//                                                             py-2
//                                                             rounded-lg
//                                                             text-xs sm:text-sm
//                                                             transition-all
//                                                             duration-200
//                                                             font-black
//                                                             ${
//                                                                 isSubActive
//                                                                     ? "bg-gradient-to-r from-[#d4a574] to-[#b88d63] text-white shadow-md"
//                                                                     : "text-white hover:bg-white/15 hover:shadow-sm"
//                                                             }
//                                                         `}
//                                                     >
//                                                         <SubIcon
//                                                             size={16}
//                                                             strokeWidth={2.5}
//                                                             className="
//                                                                 text-white
//                                                                 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]
//                                                                 transition-colors
//                                                                 duration-200
//                                                                 shrink-0
//                                                             "
//                                                         />
//                                                         <span className="font-black tracking-wide text-white whitespace-nowrap">
//                                                             {subItem.name}
//                                                         </span>
//                                                     </Link>
//                                                 </li>
//                                             );
//                                         })}
//                                     </ul>
//                                 )}
//                             </li>
//                         );
//                     })}
//                 </ul>
//             </nav>

//             {/* Bottom pinned section: WhatsApp + Email (white pill background) */}
// <div className="p-2 space-y-1 pb-15 shrink-0">
//     {bottomLinks.map((item, index) => {
//         const Icon = item.icon;
//         const isActive = location.pathname === item.path;
//         const isWhatsApp = item.path === "/ar-whatsapp";
//         const isCrm = item.path === "/crm";

//         return (
//             <Link
//                 key={index}
//                 to={item.path}
//                 className={`
//                     flex items-center
//                     ${isExpanded ? "justify-start w-full gap-2 px-3 py-2.5 rounded-xl text-sm sm:text-base" : "justify-center w-10 h-10 mx-auto rounded-full p-0 gap-0 text-xs"}
//                     transition-all
//                     duration-300
//                     ease-in-out
//                     font-black
//                     group
//                     bg-white
//                     hover:bg-white/90
//                     shadow-sm
//                     hover:shadow-md
//                 `}
//             >
//                 <Icon
//                     size={isExpanded ? 20 : 18}
//                     strokeWidth={1.1}
//                     className={`
//                         shrink-0
//                         transition-all
//                         duration-300
//                         ${
//                             isWhatsApp
//                                 ? "text-[#25D366]"
//                                 : isCrm
//                                     ? "text-[#1D9BF0]"
//                                     : "text-[#EA4335]"
//                         }
//                     `}
//                 />
//                 <span
//                     className={`
//                         font-black
//                         tracking-wide
//                         whitespace-nowrap
//                         transition-all
//                         duration-300
//                         ${
//                             isWhatsApp
//                                 ? "text-[#128C7E]"
//                                 : isCrm
//                                     ? "text-[#1D9BF0]"
//                                     : "text-[#EA4335]"
//                         }
//                         ${isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"}
//                     `}
//                 >
//                     {item.name}
//                 </span>
//             </Link>
//         );
//     })}
// </div>
//         </aside>
//     );
// }

// export default Sidebar;
