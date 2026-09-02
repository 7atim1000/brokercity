import { 
  FaCogs,
  FaUser,
  FaTags,
  FaShoppingCart,
  FaBuilding, 
  FaLayerGroup

} from 'react-icons/fa';

import { PiCurrencyDollarLight } from "react-icons/pi";
import { ImUsers } from "react-icons/im";
import { FaSortAmountUp } from "react-icons/fa";
import { FaSortAmountUpAlt } from "react-icons/fa";
import { GrTransaction } from "react-icons/gr";
import { FaCommentsDollar } from "react-icons/fa";
import { AiFillContainer } from "react-icons/ai";
import { IoSettingsSharp } from "react-icons/io5";

import { FaUsers } from "react-icons/fa";

import { IoIosCart } from "react-icons/io";
import { BsUnity } from "react-icons/bs";
import { FaSitemap } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { AiOutlinePartition } from "react-icons/ai";

import { PiBankBold } from "react-icons/pi";
import { GiMoneyStack } from "react-icons/gi";
// fa FaAmazonPay
import { FaAmazonPay } from "react-icons/fa";
import { CiCircleList } from "react-icons/ci";


import { ImCalculator } from "react-icons/im";
import { CiCalculator2 } from "react-icons/ci";

export const SidebarMenuLinks = [
  {
    name: "الرئيسية",
    path: "/ar-dashboard",
    icon: MdDashboard,
  },

  {
    name: "الاداره الماليه",
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
        name: "اداره تعريف الحسابات",
        path: "/ar-accounts",
        icon: CiCircleList
      },

      {
        name: "اداره البنوك",
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
  

  
];

