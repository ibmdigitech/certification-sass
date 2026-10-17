"use client";

import * as React from "react";

const Video = React.forwardRef<HTMLVideoElement, React.VideoHTMLAttributes<HTMLVideoElement>>(
  ({ className, ...props }, ref) => {
    return (
      <video
        ref={ref}
        className={className}
        {...props}
      />
    );
  }
);
Video.displayName = "Video";

export { Video };
