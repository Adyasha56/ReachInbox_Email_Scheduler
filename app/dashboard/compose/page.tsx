"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useToast } from "@/hooks/use-toast";
import { batchAPI, emailAPI } from "@/utils/api";
import { 
  ArrowLeft, Paperclip, Clock, X, Bold, Italic, Underline,
  List, ListOrdered, Code2, Quote
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ComposePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });
  
  const [formData, setFormData] = useState({
    subject: "",
    delayBetween: "2",
    hourlyLimit: "100",
    startTime: "",
  });
  
  const [emailList, setEmailList] = useState<string[]>([]);
  const [allEmails, setAllEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Generate preset time options
  const getPresetTimes = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return [
      {
        label: "Tomorrow",
        time: new Date(tomorrow),
      },
      {
        label: "Tomorrow, 10:00 AM",
        time: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
      },
      {
        label: "Tomorrow, 11:00 AM",
        time: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000),
      },
      {
        label: "Tomorrow, 3:00 PM",
        time: new Date(tomorrow.getTime() + 15 * 60 * 60 * 1000),
      },
    ];
  };

  const handlePresetTime = (time: Date) => {
    const isoString = time.toISOString().slice(0, 16);
    setFormData({ ...formData, startTime: isoString });
    setShowScheduleModal(false);
    toast({
      title: "Schedule set",
      description: `Email scheduled for ${time.toLocaleString()}`,
    });
  };

  const handleAttachmentClick = () => {
    attachmentInputRef.current?.click();
  };

  const handleAttachmentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // You can add file attachment logic here
    toast({
      title: "File attached",
      description: `${file.name} has been selected`,
    });
  };

  useEffect(() => {
    if (!session) {
      router.push("/");
    }
  }, [session, router]);

  const addEmail = (emailInput: string) => {
    if (!emailInput.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Handle multiple emails separated by commas or semicolons or spaces
    const emailsToAdd = emailInput
      .split(/[,;\s\n]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    let addedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const updatedEmails = [...allEmails];

    emailsToAdd.forEach((email) => {
      if (!emailRegex.test(email)) {
        invalidCount++;
        return;
      }

      if (updatedEmails.includes(email)) {
        duplicateCount++;
        return;
      }

      updatedEmails.push(email);
      addedCount++;
    });

    if (addedCount > 0) {
      setAllEmails(updatedEmails);
      setEmailList(updatedEmails.slice(0, 3));
      setEmailInput("");
      
      const messages = [];
      if (addedCount > 0) messages.push(`Added ${addedCount} email${addedCount !== 1 ? 's' : ''}`);
      if (duplicateCount > 0) messages.push(`${duplicateCount} duplicate skipped`);
      if (invalidCount > 0) messages.push(`${invalidCount} invalid skipped`);
      
      toast({
        title: "Emails Added",
        description: messages.join(" • "),
      });
    } else {
      if (duplicateCount > 0 || invalidCount > 0) {
        toast({
          title: "No emails added",
          description: `${duplicateCount} duplicates, ${invalidCount} invalid`,
          variant: "destructive",
        });
      }
    }
  };

  const handleEmailInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  const handleEmailInputBlur = () => {
    if (emailInput.trim()) {
      addEmail(emailInput);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({
          title: "Error",
          description: "Failed to read file",
          variant: "destructive",
        });
        return;
      }
      
      const lines = text.split(/\r?\n/);
      const emails: string[] = [];
      
      lines.forEach((line: string) => {
        const parts = line.split(/[,;]/);
        parts.forEach((part: string) => {
          const trimmed = part.trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(trimmed)) {
            emails.push(trimmed);
          }
        });
      });
      
      const uniqueEmails = Array.from(new Set(emails));
      
      if (uniqueEmails.length === 0) {
        toast({
          title: "No emails found",
          description: "Please check your file format",
          variant: "destructive",
        });
        return;
      }
      
      setAllEmails(uniqueEmails);
      setEmailList(uniqueEmails.slice(0, 3));
      
      toast({
        title: "File uploaded",
        description: `Found ${uniqueEmails.length} email address${uniqueEmails.length !== 1 ? 'es' : ''}`,
      });
    };
    reader.readAsText(file);
  };

  const removeEmail = (index: number) => {
    const emailToRemove = emailList[index];
    const newList = emailList.filter((_, i) => i !== index);
    setEmailList(newList);
    setAllEmails(allEmails.filter(e => e !== emailToRemove));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    const body = editor?.getHTML() || "";
    
    if (!formData.subject.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a subject",
        variant: "destructive",
      });
      return;
    }

    if (!body || body === "<p></p>") {
      toast({
        title: "Validation Error",
        description: "Please enter email body",
        variant: "destructive",
      });
      return;
    }

    if (allEmails.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startTime) {
      toast({
        title: "Validation Error",
        description: "Please set start time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.delayBetween || parseInt(formData.delayBetween) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid delay between emails",
        variant: "destructive",
      });
      return;
    }

    if (!formData.hourlyLimit || parseInt(formData.hourlyLimit) < 1) {
      toast({
        title: "Validation Error",
        description: "Please enter valid hourly limit",
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
      const emailPromises = allEmails.map((email) =>
        emailAPI.add({
          batchId,
          to: email,
          subject: formData.subject,
          bodyText: body,
        })
      );

      await Promise.all(emailPromises);

      toast({
        title: "Success!",
        description: `${allEmails.length} emails scheduled successfully`,
      });

      router.push("/dashboard/scheduled");
    } catch (error: any) {
      console.error("Error scheduling emails:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to schedule emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-medium">Compose New Email</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAttachmentClick}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4 text-gray-600" />
            </button>
            <input
              ref={attachmentInputRef}
              type="file"
              onChange={handleAttachmentSelect}
              className="hidden"
            />
            <button
              onClick={() => setShowScheduleModal(true)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Schedule send time"
            >
              <Clock className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || allEmails.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-4">
          
          {/* From */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 w-20">From</label>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-sm">{session?.user?.email || "Loading..."}</span>
              <button type="button" className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* To - Email Chips */}
          <div className="flex items-start gap-4">
            <label className="text-sm text-gray-600 w-20 pt-2">To</label>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center pb-3 border-b">
                {emailList.map((email, index) => (
                  <div key={index} className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="hover:bg-green-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {allEmails.length > 3 && (
                  <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                    +{allEmails.length - 3}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Enter email addresses (comma or space separated)"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={handleEmailInputKeyPress}
                  onBlur={handleEmailInputBlur}
                  className="flex-1 min-w-48 outline-none bg-transparent text-sm placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 ml-auto whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload List
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              {allEmails.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {allEmails.length} email{allEmails.length !== 1 ? 's' : ''} loaded
                </p>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 w-20">Subject</label>
            <input
              type="text"
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="flex-1 text-sm border-0 bg-gray-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Delay & Hourly Limit */}
          <div className="flex items-center gap-4">
            <div className="w-20"></div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Delay between 2 emails</label>
                <input
                  type="text"
                  value={formData.delayBetween}
                  onChange={(e) => setFormData({ ...formData, delayBetween: e.target.value })}
                  className="w-16 text-sm text-center border-0 bg-gray-50 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Hourly Limit</label>
                <input
                  type="text"
                  value={formData.hourlyLimit}
                  onChange={(e) => setFormData({ ...formData, hourlyLimit: e.target.value })}
                  className="w-16 text-sm text-center border-0 bg-gray-50 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="flex items-start gap-4">
            <div className="w-20"></div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 block mb-2">Type Your Reply...</label>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                {/* Toolbar */}
                {editor && (
                  <div className="flex flex-wrap gap-0.5 p-2 border-b bg-white">
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("bold") ? "bg-gray-200" : ""
                      }`}
                      title="Bold"
                    >
                      <Bold className="h-4 w-4 text-gray-700" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("italic") ? "bg-gray-200" : ""
                      }`}
                      title="Italic"
                    >
                      <Italic className="h-4 w-4 text-gray-700" />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("strike") ? "bg-gray-200" : ""
                      }`}
                      title="Strikethrough"
                    >
                      <Underline className="h-4 w-4 text-gray-700" />
                    </button>

                    <div className="w-px bg-gray-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("bulletList") ? "bg-gray-200" : ""
                      }`}
                      title="Bullet List"
                    >
                      <List className="h-4 w-4 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("orderedList") ? "bg-gray-200" : ""
                      }`}
                      title="Numbered List"
                    >
                      <ListOrdered className="h-4 w-4 text-gray-600" />
                    </button>

                    <div className="w-px bg-gray-300 mx-1" />

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("codeBlock") ? "bg-gray-200" : ""
                      }`}
                      title="Code Block"
                    >
                      <Code2 className="h-4 w-4 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={`p-1.5 hover:bg-gray-100 rounded ${
                        editor.isActive("blockquote") ? "bg-gray-200" : ""
                      }`}
                      title="Quote"
                    >
                      <Quote className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}
                
                {/* Editor Content */}
                <div className="bg-white">
                  <EditorContent
                    editor={editor}
                    className="text-sm text-gray-700 min-h-64"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Later</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Pick date & time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Quick options</span>
              </div>
            </div>

            <div className="space-y-2">
              {getPresetTimes().map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetTime(preset.time)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowScheduleModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                if (formData.startTime) {
                  setShowScheduleModal(false);
                  toast({
                    title: "Schedule saved",
                    description: `Email scheduled for ${new Date(formData.startTime).toLocaleString()}`,
                  });
                } else {
                  toast({
                    title: "Please select a time",
                    variant: "destructive",
                  });
                }
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}