import {
    Navigate,
    createBrowserRouter,
} from "react-router-dom";
import Main from "../layouts/Main";
import ErrorPage from "../layouts/ErrorPage";
import Home from "../pages/Home/Home/Home";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "../pages/Dashboard/AdminDashborad/AdminDashboard";
import SellerDashboard from "../pages/Dashboard/SellerDashboard/SellerDashboard";
import UserDashboard from "../pages/Dashboard/UserDashboard/UserDashboard";
import Login from "../pages/Login/Login/Login";
import BookSeat from "../pages/BookSeat/BookSeat";
import TermsAndConditions from "../pages/Terms&Conditions/Terms&Conditions";
import PrivacyPolicy from "../pages/PrivacyPolicy/PrivacyPolicy";
import ContactUs from "../pages/ContactUS/ContactUs";
import AboutUs from "../pages/AboutUs/AboutUs";
import RefundPolicy from "../pages/RefundPolicy/RefundPolicy";
import Disclaimer from "../pages/Disclaimer/Disclaimer";
import SeatPlanVisualization from "../pages/SeatPlanVisulization/SeatPlanVisulization";
import NewSeat from "../pages/BookSeat/NewSeat";


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/terms',
        element: <TermsAndConditions/>
      },
      {
        path: '/privacy-policy',
        element: <PrivacyPolicy />
      },
      {
        path: '/contact',
        element: <ContactUs />
      },
      {
        path: '/about',
        element: <AboutUs />
      },
      {
        path: '/refund-policy',
        element: <RefundPolicy />
      },
      {
        path: '/disclaimer',
        element: <Disclaimer />
      },
    ]
  },
  {
    path: '/dashboard',
    element: <DashboardLayout role="admin" />, 
    children: [
      {
        path: 'admin',
        element: <AdminDashboard />
      },
      {
        path: 'seller',
        element: <SellerDashboard />
      },
      {
        path: 'user',
        element: <UserDashboard />
      }
    ]
  },
  {
    path: 'login',
    element: <Login />
  },
  {
    path: 'bookSeat',
    element: <BookSeat />
  },
  {
    path: 'SeatBook',
    element: <SeatPlanVisualization />
  },
  {
    path: 'newSeatPlan',
    element: <NewSeat />
  }
]);