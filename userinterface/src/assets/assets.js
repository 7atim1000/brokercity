
import { GrTransaction } from "react-icons/gr";
import { PiBankBold } from "react-icons/pi";
import { GiMoneyStack } from "react-icons/gi";
// fa FaAmazonPay
import { FaAmazonPay } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";

import { ImCalculator } from "react-icons/im";
import { CiCalculator2 } from "react-icons/ci";

import { CgTwilio } from "react-icons/cg";
import { FaWhatsapp } from "react-icons/fa";
import { RiDashboardFill } from "react-icons/ri";
import { SiGmail } from "react-icons/si";
import { FaRegBuilding } from "react-icons/fa";
import { FaUsers } from "react-icons/fa";
import { ImUsers } from "react-icons/im";
import { GiTempleGate } from "react-icons/gi";
import { FaCalculator } from "react-icons/fa6";
import { GrVmMaintenance } from "react-icons/gr";
import { TbBuildingCommunity } from "react-icons/tb";
import { RiConnectorFill } from "react-icons/ri";
import { BsBrowserEdge } from "react-icons/bs";
import { SiGooglechrome } from "react-icons/si";

import ChromeLogo from "../components/ar/shared/ChromeLogo";
import { MdOutlineRealEstateAgent } from "react-icons/md";
import { MdOutlineMarkEmailUnread } from "react-icons/md";
import { MdLocalOffer } from "react-icons/md";

import { MdOutlineMonitor } from "react-icons/md";

export const SidebarMenuLinks = [
  {
    name: "الرئيسية",
    path: "/ar-dashboard",
    icon: RiDashboardFill,
  },
  
  {
    name: "شؤون الموظفين",
    path: "",
    icon: FaUsers,
  },
  
  {
    name: "إدارة العقارات",
    path: "",
    icon: FaRegBuilding,

    isExpanded: false,
    subItems: [
      
      {
        name: "ادارة الملاك",
        path: "/ar-owner",
        icon: TbBuildingCommunity
      },

      {
        name: "ادارة الوحدات",
        path: "/ar-unit",
        icon: TbBuildingCommunity
      },
      
      {
        name: "المستأجرين",
        path: "/ar-rentals",
        icon: ImUsers
      },

      {
        name: "إدارة التحصيل",
        path: "",
        icon: FaCalculator
      },
      
      {
        name: "الصيانة",
        path: "",
        icon: GrVmMaintenance
      },
     
    ]
  },

  {
    name: "الشئون المالية",
    path: "#",
    icon: CiCalculator2,

    isExpanded: false,
    subItems: [
      {
        name: "الحركه اليوميه",
        path: "/ar-transaction",
        icon: GrTransaction
      },
      
      {
        name: "إدارة تعريف الحسابات",
        path: "/ar-accounts",
        icon: CiCircleList
      },

      {
        name: "إدارة البنوك",
        path: "/ar-bank",
        icon: PiBankBold
      },
      {
        name: "الخزينه النقديه",
        path: "/ar-cash",
        icon: GiMoneyStack
      },
      
    ]
  },

   {
    name: "إدارة المطورين",
    path: "",
    icon: FaRegBuilding,

    isExpanded: false,
    subItems: [
      
      {
        name: "بيانات المطورين",
        path: "/ar-developer",
        icon: MdOutlineRealEstateAgent
      },

      {
        name: "مراسلة المطورين",
        path: "/ar-developer-email",
        icon: MdOutlineMarkEmailUnread
      },
    
     
    ]
  },

  {
    name: "عروض البيع",
    path: "/ar-developer-email",
    icon: MdLocalOffer,  
  },

   {
    name: "قسم المراقبة",
    path: "/ar-monitor",
    icon: MdOutlineMonitor,
  },
  

  
  
  {
    name: "الموقع اللاكتروني",
    path: "/ar-website",
    icon: ChromeLogo,
  },
  
  {
    name: " CRM / إدارة العملاء",
    path: "/crm",
    icon: RiConnectorFill,
  },
  

 
  {
    name: "WhatsApp",
    path: "/ar-whatsapp",
    icon: FaWhatsapp,
  },
  {
    name: "Email",
    path: "/email",
    icon: SiGmail,
  },

  
];

