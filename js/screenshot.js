// Turns the payment screenshot the customer picked into a small JPEG, returned as base64 (the image written as plain text) so it can travel inside the order.
const MAX_SIDE = 1600;
const MAX_CHARS = 1400000;
const QUALITIES = [0.8, 0.65, 0.5, 0.35];

export async function resizedScreenshot(file) {
  let bitmap;
  try {bitmap = await createImageBitmap(file);}
  catch {throw new Error("We could not read that image. Please choose a JPG or PNG screenshot.");}
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of QUALITIES) {
    const data = canvas.toDataURL("image/jpeg", quality).split(",")[1];
    if (data.length <= MAX_CHARS) {return {mime: "image/jpeg", data};}
  }
  throw new Error("That image is too large. Please choose a smaller screenshot.");
}
