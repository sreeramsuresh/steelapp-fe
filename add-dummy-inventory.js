// Dummy Inventory Data Generator Script
// Run this in browser console or as a standalone script

const dummyInventoryItems = [
  {
    description: "SS SHEET GR316L Mirror finish 4x8 1.2MM",
    productType: "Sheet",
    grade: "316L",
    finish: "Mirror",
    size: "4x8",
    thickness: "1.2",
    quantity: 25,
    pricePurchased: 850,
    sellingPrice: 1200,
    landedCost: 920,
    location: "Warehouse A - Section 1"
  },
  {
    description: "SS PIPE GR304 HL finish 2 inch 3.0MM",
    productType: "Pipe",
    grade: "304",
    finish: "HL",
    size: "2 inch",
    thickness: "3.0",
    quantity: 12,
    pricePurchased: 1200,
    sellingPrice: 1650,
    landedCost: 1280,
    location: "Warehouse A - Section 2"
  },
  {
    description: "SS ROUND BAR GR316 Bright finish 25mm",
    productType: "Round Bar",
    grade: "316",
    finish: "Bright",
    size: "25mm",
    thickness: "",
    quantity: 8,
    pricePurchased: 950,
    sellingPrice: 1350,
    landedCost: 1020,
    location: "Warehouse B - Section 1"
  },
  {
    description: "SS ANGLE GR304L 2B finish 50x50x5",
    productType: "Angle",
    grade: "304L",
    finish: "2B",
    size: "50x50x5",
    thickness: "5.0",
    quantity: 4,
    pricePurchased: 720,
    sellingPrice: 1050,
    landedCost: 780,
    location: "Warehouse B - Section 2"
  },
  {
    description: "SS FLAT BAR GR316L HL finish 40x10",
    productType: "Flat Bar",
    grade: "316L",
    finish: "HL",
    size: "40x10",
    thickness: "10.0",
    quantity: 15,
    pricePurchased: 890,
    sellingPrice: 1280,
    landedCost: 960,
    location: "Warehouse A - Section 3"
  },
  {
    description: "SS HEXAGON BAR GR304 Bright finish 12mm",
    productType: "Hexagon Bar",
    grade: "304",
    finish: "Bright",
    size: "12mm",
    thickness: "",
    quantity: 6,
    pricePurchased: 680,
    sellingPrice: 980,
    landedCost: 720,
    location: "Warehouse C - Section 1"
  },
  {
    description: "SS SQUARE BAR GR316 Mirror finish 20x20",
    productType: "Square Bar",
    grade: "316",
    finish: "Mirror",
    size: "20x20",
    thickness: "20.0",
    quantity: 18,
    pricePurchased: 1150,
    sellingPrice: 1580,
    landedCost: 1220,
    location: "Warehouse C - Section 2"
  },
  {
    description: "SS COIL GR304L 2B finish 1500mm 0.8MM",
    productType: "Coil",
    grade: "304L",
    finish: "2B",
    size: "1500mm",
    thickness: "0.8",
    quantity: 3,
    pricePurchased: 2200,
    sellingPrice: 2950,
    landedCost: 2350,
    location: "Warehouse D - Large Items"
  },
  {
    description: "SS CHANNEL GR316L HL finish 100x50x8",
    productType: "Channel",
    grade: "316L",
    finish: "HL",
    size: "100x50x8",
    thickness: "8.0",
    quantity: 7,
    pricePurchased: 1450,
    sellingPrice: 1920,
    landedCost: 1520,
    location: "Warehouse D - Section 1"
  },
  {
    description: "SS WIRE GR304 Bright finish 8mm",
    productType: "Wire",
    grade: "304",
    finish: "Bright",
    size: "8mm",
    thickness: "",
    quantity: 22,
    pricePurchased: 420,
    sellingPrice: 680,
    landedCost: 450,
    location: "Warehouse B - Section 3"
  },
  {
    description: "SS TEE GR316 Mirror finish 50x50x5",
    productType: "Tee",
    grade: "316",
    finish: "Mirror",
    size: "50x50x5",
    thickness: "5.0",
    quantity: 9,
    pricePurchased: 1320,
    sellingPrice: 1780,
    landedCost: 1390,
    location: "Warehouse A - Section 4"
  },
  {
    description: "SS ELBOW GR304L HL finish 90 degree 25mm",
    productType: "Elbow",
    grade: "304L",
    finish: "HL",
    size: "25mm",
    thickness: "3.0",
    quantity: 14,
    pricePurchased: 580,
    sellingPrice: 850,
    landedCost: 620,
    location: "Warehouse C - Section 3"
  }
];

// Function to add all dummy items
async function addDummyInventoryItems() {
  console.log('Starting to add dummy inventory items...');
  
  try {
    // Import the inventory service
    const { inventoryService } = await import('./src/services/inventoryService.js');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const item of dummyInventoryItems) {
      try {
        const response = await inventoryService.createItem(item);
        console.log(`✅ Added: ${item.description}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to add: ${item.description}`, error);
        errorCount++;
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully added: ${successCount} items`);
    console.log(`❌ Failed to add: ${errorCount} items`);
    console.log(`📦 Total inventory items: ${successCount} items`);
    
  } catch (error) {
    console.error('Failed to import inventory service:', error);
  }
}

// Instructions for running this script
console.log('To add dummy inventory data:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Navigate to your inventory page');
console.log('3. Copy and paste this entire script into the console');
console.log('4. Call: addDummyInventoryItems()');
console.log('');

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dummyInventoryItems, addDummyInventoryItems };
}