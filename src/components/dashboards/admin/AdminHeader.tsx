@@ .. @@
   return (
   )
-    <header className="bg-white shadow-sm border-b border-gray-200 lg:fixed lg:top-0 lg:right-0 lg:left-64 z-30">
+    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 lg:fixed lg:top-0 lg:right-0 lg:left-64 z-30 transition-colors duration-200">
       <div className="px-4 sm:px-6 lg:px-8">
         <div className="flex items-center justify-between h-16">
           {/* Mobile menu button */}
           <button
             onClick={() => setSidebarOpen(true)}
-            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
+            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
           >
             <Menu className="w-6 h-6" />
           </button>
           
           {/* Page title */}
           <div className="flex-1 lg:flex-none">
-            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
+            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
           </div>
           
           {/* User menu */}
@@ -26,7 +26,7 @@
               <div className="flex items-center space-x-3">
                 <div className="text-right hidden sm:block">
                   <p className="text-sm font-medium text-gray-900 dark:text-white">{user.profile_details?.full_name}</p>
-                  <p className="text-xs text-gray-500">{user.roles[0]}</p>
+                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.roles[0]}</p>
                 </div>
                 <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                   <User className="w-5 h-5 text-blue-600" />