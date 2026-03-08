import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View, type ViewProps } from 'react-native';

function Card({ className, style, ...props }: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      style={[{ flexDirection: 'column', gap: 24, paddingVertical: 24 }, style]}
      className={cn('bg-card border-border rounded-xl border shadow-sm shadow-black/5', className)}
      {...props}
    />
  );
}

function CardHeader({ className, style, ...props }: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      style={[{ flexDirection: 'column', gap: 6, paddingHorizontal: 24 }, style]}
      className={className}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('text-card-foreground font-semibold leading-7', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return <Text className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

function CardContent({ className, style, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View style={[{ paddingHorizontal: 24 }, style]} className={className} {...props} />;
}

function CardFooter({ className, style, ...props }: ViewProps & React.RefAttributes<View>) {
  return (
    <View
      style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 }, style]}
      className={className}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
