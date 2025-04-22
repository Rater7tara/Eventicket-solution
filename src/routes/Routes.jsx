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
  }
]);