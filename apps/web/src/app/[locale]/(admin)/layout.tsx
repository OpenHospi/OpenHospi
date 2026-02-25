type Props = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      {children}
    </div>
  );
}
