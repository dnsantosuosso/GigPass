import * as React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActionButtonProps = Omit<ButtonProps, 'children'> & {
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ label, icon, rightIcon, className, ...props }, ref) => (
    <Button ref={ref} className={cn('gap-2', className)} {...props}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {rightIcon}
    </Button>
  )
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
