import React, { useState } from "react";

const Invoice = () => {
  const [invoiceData, setInvoiceData] = useState({
    customerName: "",
    invoiceNumber: "",
    date: "",
    items: [{ description: "", quantity: 1, price: 0 }],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index?: number
  ) => {
    const { name, value } = e.target;
    if (index !== undefined) {
      const items = [...invoiceData.items];
      items[index] = { ...items[index], [name]: value };
      setInvoiceData({ ...invoiceData, items });
    } else {
      setInvoiceData({ ...invoiceData, [name]: value });
    }
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const items = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items });
  };

  return (
    <div>
      <h1>Invoice</h1>
      <form>
        <div>
          <label>Customer Name:</label>
          <input
            type="text"
            name="customerName"
            value={invoiceData.customerName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Invoice Number:</label>
          <input
            type="text"
            name="invoiceNumber"
            value={invoiceData.invoiceNumber}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={invoiceData.date}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <h2>Items</h2>
          {invoiceData.items.map((item, index) => (
            <div key={index}>
              <label>Description:</label>
              <input
                type="text"
                name="description"
                value={item.description}
                onChange={(e) => handleInputChange(e, index)}
              />
              <label>Quantity:</label>
              <input
                type="number"
                name="quantity"
                value={item.quantity}
                onChange={(e) => handleInputChange(e, index)}
              />
              <label>Price:</label>
              <input
                type="number"
                name="price"
                value={item.price}
                onChange={(e) => handleInputChange(e, index)}
              />
              <button type="button" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem}>
            Add Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default Invoice;
