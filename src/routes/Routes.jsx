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
import TermsAndConditions from "../pages/Terms&Conditions/Terms&Conditions";
import PrivacyPolicy from "../pages/PrivacyPolicy/PrivacyPolicy";
import ContactUs from "../pages/ContactUS/ContactUs";
import AboutUs from "../pages/AboutUs/AboutUs";
import RefundPolicy from "../pages/RefundPolicy/RefundPolicy";
import Disclaimer from "../pages/Disclaimer/Disclaimer";
import Register from "../pages/Login/Register/Register";
import EventDetails from "../pages/Home/Home/EventDetails/EventDetails";
import SeatPlan from "../pages/BookSeat/SeatPlan";
import CheckoutTickets from "../pages/Home/CheckoutTickets/CheckoutTickets";
import MyTickets from "../pages/Dashboard/UserDashboard/MyTickects/MyTickets";
import AddEvents from "../pages/Dashboard/SellerDashboard/AddEvents/AddEvents";
import MyEvents from "../pages/Dashboard/SellerDashboard/MyEvents/MyEvents";
import TicketSellReport from "../pages/Dashboard/SellerDashboard/TicketSellReport/TicketSellReport";
import DashboardWelcome from "../pages/Dashboard/WelcomePage/DashboardWelcome";
import UserDetailsForm from "../pages/Home/Home/UserDetailsForm/UserDetailsForm";
import ManageUsers from "../pages/Dashboard/AdminDashborad/ManageUsers/ManageUsers";


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
        path: '/events/:id', 
        element: <EventDetails />,
      },
      {
        path: '/checkout', 
        element: <CheckoutTickets />,
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
      {
        path: '/user-details',
        element: <UserDetailsForm />,
      },
    ]
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true, // Default dashboard route
        element: <DashboardWelcome />, // Default to user dashboard directly
      },
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
      },
      {
        path: 'my-tickets',
        element: <MyTickets />
      },
      // Admin specific routes
      {
        path: 'manage-users',
        element: <ManageUsers />,
      },
      {
        path: 'reports',
        element: <AdminDashboard /> // Replace with actual component
      },
      // Seller specific routes
      {
        path: 'my-events',
        element: <MyEvents />,
      },
      {
        path: 'add-event',
        element: <AddEvents />,
      },
      {
        path: 'sales-report',
        element: <TicketSellReport />,
      },
      // User specific routes
      {
        path: 'upcoming-events',
        element: <UserDashboard /> // Replace with actual component
      },
      {
        path: 'purchase-history',
        element: <UserDashboard /> // Replace with actual component
      },
      // Common routes
      {
        path: 'settings',
        element: <UserDashboard /> // Replace with actual component
      }
    ]
  },
  {
    path: 'login',
    element: <Login />
  },
  {
    path: 'register',
    element: <Register />
  },
  {
    path: 'SeatPlan',
    element: <SeatPlan />
  }
]);