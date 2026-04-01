import { useState } from "react";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import { mockOrders } from "@/data/mockData";

const QUERY_TYPES = [
  "Replacement",
  "Damaged",
  "Refund",
  "Wrong Item",
  "Other"
];

export default function OrderQueryForm() {
  const [orderId, setOrderId] = useState("");
  const [queryType, setQueryType] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: Send data to backend
    setTimeout(() => {
      setSubmitting(false);
      alert("Request submitted!");
      setOrderId("");
      setQueryType("");
      setMessage("");
      setImages([]);
    }, 1200);
  };

  return (
    <GlassCard className="max-w-lg mx-auto p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">Order Related Query</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Order</label>
          <select
            value={orderId}
            onChange={e => setOrderId(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Choose an Order</option>
            {mockOrders.slice(0, 20).map(order => (
              <option key={order.id} value={order.id}>
                {order.id} - {order.date} ({order.amount})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Query Type</label>
          <select
            value={queryType}
            onChange={e => setQueryType(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            required
          >
            <option value="">Select Query Type</option>
            {QUERY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Describe your issue</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            rows={4}
            required
            placeholder="Please provide as much detail as possible..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Upload Images (optional)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">{img.name}</span>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>
      </form>
    </GlassCard>
  );
}
