"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
} from "lucide-react";

interface DocumentUploadProps {
  label: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
  placeholder?: string;
  icon?: "upload" | "camera" | "file";
}

export function DocumentUpload({
  label,
  required = false,
  accept = "image/*,.pdf",
  maxSize = 5,
  onFileSelect,
  selectedFile,
  error,
  placeholder,
  icon = "upload",
}: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Validate file type
      const allowedTypes = accept.split(",").map((type) => type.trim());
      const isValidType = allowedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes("*")) {
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isValidType) {
        alert(`Invalid file type. Allowed types: ${accept}`);
        return;
      }
    }

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getIcon = () => {
    switch (icon) {
      case "camera":
        return <Camera className="h-8 w-8 text-gray-400" />;
      case "file":
        return <FileText className="h-8 w-8 text-gray-400" />;
      default:
        return <Upload className="h-8 w-8 text-gray-400" />;
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <Camera className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50"
            : selectedFile
              ? "border-green-500 bg-green-50"
              : error
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {getFileTypeIcon(selectedFile)}
              <span className="text-sm font-medium text-gray-900">
                {selectedFile.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFileSelect(null)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            {getIcon()}
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">
                {placeholder || `Upload ${label.toLowerCase()}`}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Drag & drop or click to browse
                <br />
                Max size: {maxSize}MB • Types: {accept}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {selectedFile && !error && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          File selected successfully
        </div>
      )}
    </div>
  );
}
