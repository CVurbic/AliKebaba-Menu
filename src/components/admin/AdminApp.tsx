import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import MenuItemsPage from "./menu/MenuItemsPage";
import LocationsPage from "./locations/LocationsPage";
import BranchMenuPage from "./menu/BranchMenuPage";


export default function AdminApp() {
    return (
        <AdminGuard>
            <AdminLayout>
                <Routes>
                    <Route path="/" element={<Navigate to="/admin/menu" replace />} />
                    <Route path="/menu" element={<BranchMenuPage />} />
                    <Route path="/locations" element={<LocationsPage />} />
                    <Route path="*" element={<Navigate to="/admin/menu" replace />} />
                    {/* <Route path="/menu-by-location" element={<BranchMenuPage />} /> */}

                </Routes>
            </AdminLayout>
        </AdminGuard>
    );
}
