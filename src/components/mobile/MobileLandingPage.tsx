@@ .. @@
   return (
-    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-red-100/50 to-red-200/30">
-      {/* Enhanced mobile background */}
-      <div className="absolute inset-0 bg-gradient-to-br from-red-100/80 via-red-200/60 to-red-300/70"></div>
-      <div className="absolute inset-0 backdrop-blur-sm"></div>
+    <div className="min-h-screen relative overflow-hidden">
+      {/* Adobe-style linear gradient background */}
+      <div className="absolute inset-0 bg-gradient-to-br from-[#F40F02] to-[#FAD0C4]"></div>
+      <div className="absolute inset-0 bg-white/10"></div>
       
-      {/* Mobile-optimized decorative elements */}
-      <div className="absolute top-10 right-5 w-32 h-32 bg-red-400/20 rounded-full blur-2xl"></div>
-      <div className="absolute bottom-10 left-5 w-28 h-28 bg-red-500/15 rounded-full blur-xl"></div>
-      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-red-300/25 rounded-full blur-lg"></div>
-      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-white/20 rounded-full blur-lg"></div>
+      {/* Subtle decorative elements */}
+      <div className="absolute top-10 right-5 w-32 h-32 bg-white/8 rounded-full blur-2xl"></div>
+      <div className="absolute bottom-10 left-5 w-28 h-28 bg-white/6 rounded-full blur-xl"></div>
+      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/7 rounded-full blur-lg"></div>
+      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-white/8 rounded-full blur-lg"></div>
 
       {/* Mobile Menu Overlay */}
       {isMobileMenuOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
       )}
 
       {/* Mobile Sidebar */}
       <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl border-r border-white/50 flex flex-col shadow-2xl transition-transform duration-300 ${
         isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
       }`}>
         <div className="p-6 flex-1">
           {/* Close Button */}
           <button
             onClick={() => setIsMobileMenuOpen(false)}
             className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full"
           >
             <X className="w-6 h-6" />
           </button>
 
           {/* Logo Section */}
           <div className="flex items-center gap-4 mb-8 pt-2">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
               alt="Adobe Acrobat" 
               className="w-12 h-12 object-contain"
             />
             <h1 className="text-xl font-semibold text-gray-900">Adobe Cloud</h1>
           </div>
 
           {/* Navigation */}
           <nav className="space-y-3">
             {navItems.map((item) => (
               <button
                 key={item}
                 onClick={() => {
                   setActiveNav(item);
                   setIsMobileMenuOpen(false);
                 }}
                 className={`w-full text-left px-4 py-4 rounded-xl font-medium text-base transition-all duration-200 flex items-center justify-between ${
                   activeNav === item
                     ? 'bg-red-50 text-red-600 shadow-sm border border-red-100'
-                    : 'text-gray-600 hover:bg-gray-50'
+                    : 'text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 {item}
                 {activeNav === item && <ChevronRight className="w-5 h-5" />}
               </button>
             ))}
           </nav>
         </div>
 
         {/* Adobe Footer */}
         <div className="p-6 border-t border-white/50">
           <p className="text-sm text-gray-700 leading-relaxed font-medium">
             © 2025 Adobe Inc.<br />
             All rights reserved.
           </p>
         </div>
       </aside>
 
       {/* Main Content */}
       <main className="relative z-10 min-h-screen">
         {/* Mobile Header */}
-        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-white/50 px-5 py-4">
+        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-white/60 px-5 py-4">
           <div className="flex items-center justify-between">
             <button
               onClick={() => setIsMobileMenuOpen(true)}
-              className="p-3 text-gray-600 hover:text-gray-900 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200"
+              className="p-3 text-gray-700 hover:text-gray-900 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="flex items-center gap-3">
               <img 
                 src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/PDF_file_icon.svg/833px-PDF_file_icon.svg.png" 
                 alt="Adobe Acrobat" 
                 className="w-8 h-8 object-contain"
               />
               <span className="font-semibold text-gray-900 text-lg">Adobe Cloud</span>
             </div>
             <div className="w-12"></div> {/* Spacer for centering */}
           </div>
         </div>
 
         {/* Content Area */}
         <div className="p-5 pb-8">
           {/* Page Header */}
           <div className="mb-6">
             <h2 className="text-2xl font-bold text-gray-900 mb-2">
               {headerContent.title}
             </h2>
-            <p className="text-base text-gray-600 leading-relaxed">{headerContent.description}</p>
+            <p className="text-base text-gray-800 font-medium leading-relaxed">{headerContent.description}</p>
           </div>
 
           {/* Action Buttons - Only show if not in Trash */}
           {activeNav !== 'Trash' && (
             <div className="flex gap-3 mb-6">
-              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-base bg-white/90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-md">
+              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-base bg-white/95 backdrop-blur-sm text-gray-800 border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-md">
                 <Grid3X3 className="w-5 h-5" />
                 Grid View
               </button>
-              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-base bg-white/90 backdrop-blur-sm text-gray-700 border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-md">
+              <button className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-base bg-white/95 backdrop-blur-sm text-gray-800 border-2 border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-md">
                 <Upload className="w-5 h-5" />
                 Upload
               </button>
             </div>
           )}
 
           {/* File List */}
           {activeNav === 'Trash' ? renderEmptyState() : renderMobileFileList()}
         </div>
       </main>
     </div>
   );
 };