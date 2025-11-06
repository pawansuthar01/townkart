export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        {/* TownKart Logo/Brand */}
        <div className="mb-8">
          <div className="townkart-gradient p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">TownKart</h1>
          <p className="text-gray-600">Loading your experience...</p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2 mb-8">
          <div className="w-3 h-3 bg-townkart-primary rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-townkart-secondary rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-townkart-accent rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        {/* Loading Text */}
        <div className="text-sm text-gray-500">
          <div className="animate-pulse">Preparing your dashboard...</div>
        </div>
      </div>
    </div>
  );
}
