import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { SignUp } from "./pages/SignUp";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Checklist } from "./pages/Checklist";
import { StudentInfo } from "./pages/StudentInfo";
import { ReturningDashboard } from "./pages/ReturningDashboard";
import { SubjectEligibility } from "./pages/SubjectEligibility";
import { Recommendations } from "./pages/Recommendations";
import { AdvisingSummary } from "./pages/AdvisingSummary";
import { ProtectedRoute } from "../routes/ProtectedRoute";
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyNotice } from './pages/PrivacyNotice';
import { ResetPassword } from './pages/ResetPassword';
import { CurriculumRoadmap } from './pages/CurriculumRoadmap';



export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "signup", Component: SignUp },
      { path: "login", Component: Login },
      { path: "dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "dashboard/returning", element: <ProtectedRoute><ReturningDashboard /></ProtectedRoute> },
      { path: "dashboard/eligibility", element: <ProtectedRoute><SubjectEligibility /></ProtectedRoute> },
      { path: "dashboard/recommendations", element: <ProtectedRoute><Recommendations /></ProtectedRoute> },
      { path: "dashboard/advising", element: <ProtectedRoute><AdvisingSummary /></ProtectedRoute> },
      { path: "dashboard/checklist", element: <ProtectedRoute><Checklist /></ProtectedRoute> },
      { path: "dashboard/student-info", element: <ProtectedRoute><StudentInfo /></ProtectedRoute> },
      { path: 'terms-of-service', Component: TermsOfService },
      { path: 'privacy-notice', Component: PrivacyNotice },
      { path: 'reset-password', Component: ResetPassword },
      { path: 'dashboard/roadmap', Component: CurriculumRoadmap },
    ],
  },
]);