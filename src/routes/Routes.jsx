import { Navigate, createBrowserRouter } from "react-router-dom";
import Main from "../layouts/Main";
import ErrorPage from "../layouts/ErrorPage";
import Home from "../pages/Home/Home/Home";
import DashboardLayout from "../layouts/DashboardLayout";
import AdminDashboard from "../pages/Dashboard/AdminDashborad/AdminDashboard";
import SellerDashboard from "../pages/Dashboard/SellerDashboard/SellerDashboard";
import UserDashboard from "../pages/Dashboard/UserDashboard/BuyerDashboard";

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
import UserDetailsForm from "../pages/Home/Home/UserDetailsForm/UserDetailsForm";
import ManageUsers from "../pages/Dashboard/AdminDashborad/ManageUsers/ManageUsers";
import CreateEvent from "../pages/Dashboard/AdminDashborad/CreateEvent/CreateEvent";
import ManageEvents from "../pages/Dashboard/AdminDashborad/ManageEvents/ManageEvents";
import BuyerDashboard from "../pages/Dashboard/UserDashboard/BuyerDashboard";
import SoldTickets from "../pages/Dashboard/AdminDashborad/SoldTickets/SoldTickets";
import ManageSellerRequests from "../pages/Dashboard/AdminDashborad/SellerRequest/ManageSellerRequests";
import AdminProfile from "../pages/Dashboard/AdminDashborad/AdminProfille/AdminProfile";
import Reports from "../pages/Dashboard/AdminDashborad/Reports/Reports";
import SellerProfile from "../pages/Dashboard/SellerDashboard/SellerProfile/SellerProfile";
import BuyerProfile from "../pages/Dashboard/UserDashboard/BuyerProfile/BuyerProfile";
import SellerCoupons from "../pages/Dashboard/SellerDashboard/SellerCoupons/SellerCoupons";
import EventList from "../pages/Home/Home/EventCard/EventList";
import Blog from "../pages/Blog/Blog";
import AddBlogs from "../pages/Dashboard/AdminDashborad/AddBlog/AddBlog";
import BlogPost from "../pages/Blog/BlogPost";
import RoleBasedDashboard from "../pages/Dashboard/RoleBasedDashboard";
import EventReport from "../pages/Dashboard/AdminDashborad/Reports/EventReport";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/event-list",
        element: <EventList />,
      },
      {
        path: "/events/:id",
        element: <EventDetails />,
      },
      {
        path: "/terms",
        element: <TermsAndConditions />,
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicy />,
      },
      {
        path: "/contact",
        element: <ContactUs />,
      },
      {
        path: "/about",
        element: <AboutUs />,
      },
      {
        path: "/refund-policy",
        element: <RefundPolicy />,
      },
      {
        path: "/disclaimer",
        element: <Disclaimer />,
      },
      {
        path: "/blogs",
        element: <Blog />,
      },
      {
        path: "/blog/:id",
        element: <BlogPost />,
      },
      {
        path: "/user-details",
        element: <UserDetailsForm />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      {
        index: true, // Default dashboard route - NOW SHOWS ROLE-BASED DASHBOARD
        element: <RoleBasedDashboard />, // Changed from BuyerDashboard to RoleBasedDashboard
      },

      // User specific routes
      {
        path: "my-tickets",
        element: <MyTickets />,
      },
      {
        path: "buyer-profile",
        element: <BuyerProfile />,
      },
      {
        path: "purchase-history",
        element: <div>Purchase History coming soon</div>, // Placeholder
      },

      // Admin specific routes
      {
        path: "admin", // Keep this route for direct access if needed
        element: <AdminDashboard />,
      },
      {
        path: "manage-users",
        element: <ManageUsers />,
      },
      {
        path: "manage-sellers",
        element: <ManageSellerRequests />,
      },
      {
        path: "create-events",
        element: <CreateEvent />,
      },
      {
        path: "manage-events",
        element: <ManageEvents />,
      },
      {
        path: "sold-tickets",
        element: <SoldTickets />,
      },
      {
        path: "admin-profile",
        element: <AdminProfile />,
      },
      {
        path: "add-blogs",
        element: <AddBlogs />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "reports/event/:eventId",
        element: <EventReport />,
      },

      // Seller specific routes
      {
        path: "seller", // Keep this route for direct access if needed
        element: <SellerDashboard />,
      },
      {
        path: "my-events",
        element: <MyEvents />,
      },
      {
        path: "add-event",
        element: <AddEvents />,
      },
      {
        path: "sales-report",
        element: <TicketSellReport />,
      },
      {
        path: "seller-profile",
        element: <SellerProfile />,
      },
      {
        path: "coupons",
        element: <SellerCoupons />,
      },

      // Common routes
      {
        path: "settings",
        element: <div>Settings coming soon</div>, // Placeholder
      },
    ],
  },
  {
    path: "SeatPlan",
    element: <SeatPlan />,
  },
  {
    path: "/checkout",
    element: <CheckoutTickets />,
  },
]);