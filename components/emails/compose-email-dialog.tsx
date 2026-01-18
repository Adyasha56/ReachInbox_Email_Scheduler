"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { batchAPI, emailAPI } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  onSuccess,
}: ComposeEmailDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    startTime: "",
    delayBetween: "",
    hourlyLimit: "",
  });
  const [emailList, setEmailList] = useState<string[]>([]);
  const [emailCount, setEmailCount] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Parse CSV or text file for email addresses
      // Handle CSV with headers, comma-separated, semicolon-separated, or line-separated
      const lines = text.split(/\r?\n/);
      const emails: string[] = [];
      
      lines.forEach((line) => {
        // Split by comma or semicolon
        const parts = line.split(/[,;]/);
        parts.forEach((part) => {
          const trimmed = part.trim();
          // Simple email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(trimmed)) {
            emails.push(trimmed);
          }
        });
      });
      
      // Remove duplicates
      const uniqueEmails = Array.from(new Set(emails));
      
      setEmailList(uniqueEmails);
      setEmailCount(uniqueEmails.length);
      
      toast({
        title: "File uploaded",
        description: `Found ${uniqueEmails.length} email addresses`,
      });
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.body || emailList.length === 0) {
      toast({
        title: "Error",
        description: "Please fill all required fields and upload email list",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startTime || !formData.delayBetween || !formData.hourlyLimit) {
      toast({
        title: "Error",
        description: "Please fill all scheduling fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create batch
      const batchResponse = await batchAPI.create({
        name: `Campaign - ${formData.subject.substring(0, 30)}`,
        startTime: new Date(formData.startTime).toISOString(),
        delayBetween: parseInt(formData.delayBetween),
        hourlyLimit: parseInt(formData.hourlyLimit),
      });

      const batchId = batchResponse.data.id;

      // Add all emails to the batch
      const emailPromises = emailList.map((email) =>
        emailAPI.add({
          batchId,
          to: email,
          subject: formData.subject,
          bodyText: formData.body,
        })
      );

      await Promise.all(emailPromises);

      toast({
        title: "Success",
        description: `Scheduled ${emailList.length} emails successfully`,
      });

      // Reset form
      setFormData({
        subject: "",
        body: "",
        startTime: "",
        delayBetween: "",
        hourlyLimit: "",
      });
      setEmailList([]);
      setEmailCount(0);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error scheduling emails:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to schedule emails",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compose New Email</DialogTitle>
          <DialogDescription>
            Create and schedule your email campaign
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input id="from" value="oliver.brown@domain.io" disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <div className="flex gap-2">
                <Input
                  id="to"
                  placeholder={emailList.length > 0 ? `${emailList.slice(0, 3).join(", ")}${emailList.length > 3 ? ` +${emailList.length - 3} more` : ""}` : "recipient@example.com"}
                  value={emailList.length > 0 ? `${emailList.slice(0, 3).join(", ")}${emailList.length > 3 ? ` +${emailList.length - 3} more` : ""}` : ""}
                  disabled
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload List
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              {emailCount > 0 && (
                <p className="text-sm text-gray-500">
                  {emailCount} email address{emailCount !== 1 ? "es" : ""} loaded
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delayBetween">Delay between 2 emails (seconds)</Label>
              <Input
                id="delayBetween"
                type="number"
                placeholder="00"
                value={formData.delayBetween}
                onChange={(e) =>
                  setFormData({ ...formData, delayBetween: e.target.value })
                }
                required
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyLimit">Hourly Limit</Label>
              <Input
                id="hourlyLimit"
                type="number"
                placeholder="00"
                value={formData.hourlyLimit}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyLimit: e.target.value })
                }
                required
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Type Your Reply...</Label>
            <Textarea
              id="body"
              placeholder="Enter your email body"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              rows={10}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
