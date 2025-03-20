"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Save } from "lucide-react";

export default function PDCASettingsPage() {
  const router = useRouter();
  const [pdcaItems, setPdcaItems] = useState([
    { id: "1", text: "Did what I planned happen?", enabled: true },
    { id: "2", text: "Did I have a sense of urgency in each of my appointments?", enabled: true },
    { id: "3", text: "Did I manage my time so that all urgent and important things happened?", enabled: true },
    { id: "4", text: "What did I learn, and if needed, how can I adjust?", enabled: true, isAdjustment: true }
  ]);

  const [newItemText, setNewItemText] = useState("");

  const toggleItem = (id: string) => {
    setPdcaItems(pdcaItems.map(item => 
      item.id === id ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const updateItemText = (id: string, text: string) => {
    setPdcaItems(pdcaItems.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const addNewItem = () => {
    if (newItemText.trim() === "") return;
    
    const newId = (parseInt(pdcaItems[pdcaItems.length - 1]?.id || "0") + 1).toString();
    
    setPdcaItems([...pdcaItems, { 
      id: newId, 
      text: newItemText, 
      enabled: true,
      isAdjustment: false
    }]);
    
    setNewItemText("");
  };

  const removeItem = (id: string) => {
    if (pdcaItems.length <= 1) return;
    setPdcaItems(pdcaItems.filter(item => item.id !== id));
  };

  const saveChanges = () => {
    // Here you would save the PDCA template to Firebase
    console.log("Saving PDCA template:", pdcaItems);
    
    // Show success message and redirect back
    router.push("/settings");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-[var(--apple-gray-900)] dark:text-white mb-2">PDCA Template</h1>
      <p className="text-[var(--apple-gray-500)] dark:text-[var(--apple-gray-400)] mb-6">Customize your daily PDCA checklist items</p>

      <div className="apple-card p-6 mb-6">
        <div className="space-y-4">
          {pdcaItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <div className="flex h-5 items-center mr-3">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => toggleItem(item.id)}
                  className="h-4 w-4 rounded border-[var(--apple-gray-300)] text-[var(--green-primary)] focus:ring-[var(--green-primary)]"
                />
              </div>
              {item.isAdjustment ? (
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] mb-1.5">
                    {item.text}
                  </label>
                  <textarea
                    rows={2}
                    className="apple-input resize-none"
                    placeholder="What adjustments are needed..."
                    disabled
                  ></textarea>
                </div>
              ) : (
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                  className="apple-input"
                  placeholder="PDCA question..."
                />
              )}
              {pdcaItems.length > 1 && !item.isAdjustment && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-[var(--apple-gray-400)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="apple-input mr-2"
              placeholder="Add a new PDCA question..."
            />
            <button
              type="button"
              onClick={addNewItem}
              className="apple-button-green h-12"
              disabled={newItemText.trim() === ""}
            >
              <PlusCircle className="h-5 w-5 mr-1" />
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="py-2.5 px-5 border border-[var(--apple-gray-200)] dark:border-[var(--apple-gray-700)] text-[var(--apple-gray-700)] dark:text-[var(--apple-gray-300)] rounded-full hover:bg-[var(--apple-gray-50)] dark:hover:bg-[var(--apple-gray-800)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={saveChanges}
          className="apple-button-green py-2.5 px-5"
        >
          <Save className="h-5 w-5 mr-2" />
          Save Template
        </button>
      </div>
    </div>
  );
} 