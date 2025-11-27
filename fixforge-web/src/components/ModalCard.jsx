import * as React from "react";

export function ModalCard({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl border border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalCardHeader({ className = "", children, ...props }) {
  return (
    <div
      className={`p-6 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalCardContent({ className = "", children, ...props }) {
  return (
    <div
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ModalCardFooter({ className = "", children, ...props }) {
  return (
    <div
      className={`p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
