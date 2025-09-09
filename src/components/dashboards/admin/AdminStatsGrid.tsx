return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* Total Students */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {loading ? (
                <span className="animate-pulse bg-gray-200 rounded h-8 w-16 block"></span>
              ) : (
                stats.totalStudents
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+12% from last month</span>
        </div>
      </div>
      
      {/* Total Teachers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <GraduationCap className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Teachers</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {loading ? (
                <span className="animate-pulse bg-gray-200 rounded h-8 w-16 block"></span>
              ) : (
                stats.totalTeachers
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+3% from last month</span>
        </div>
      </div>
      
      {/* Online Users */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online Now</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {onlineCount}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
      
      {/* Total Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Classes</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {loading ? (
                <span className="animate-pulse bg-gray-200 rounded h-8 w-16 block"></span>
              ) : (
                stats.totalClasses
              )}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+5% from last month</span>
        </div>
      </div>
    </div>
  )