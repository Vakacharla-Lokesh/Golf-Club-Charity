export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Golf Charity
          </h1>
          <p className="mt-1 text-center text-sm text-gray-600">
            Play golf. Win prizes. Support charity.
          </p>
        </div>
        <div className="px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
