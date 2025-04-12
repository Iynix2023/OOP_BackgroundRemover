export const uploadToCloud = async (base64Image: string): Promise<string> => {
    try {
      const blob = await (await fetch(base64Image)).blob();
      const formData = new FormData();
      formData.append("file", blob, "id-photo.png");
      formData.append("description", "Uploaded from ID photo app");
  
      const response = await fetch("http://localhost:8080/upload", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
  
      return "Upload Successful";
    } catch (err: any) {
      console.error("Cloud upload error:", err.message || err);
      throw err;
    }
  };
  


// const uploadToCloud = async (base64Image: string): Promise<string> => {
//     try {
//       const blob = await (await fetch(base64Image)).blob();
//       const formData = new FormData();
//       formData.append("file", blob, "id-photo.png");
//       formData.append("description", "Uploaded from ID photo app");
  
//       const response = await fetch("http://localhost:8080/upload", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Upload failed: ${errorText}`);
//       }
  
//       return "Upload Successful";
//     } catch (err: any) {
//       console.error("Cloud upload error:", err.message || err);
//       throw err; // ❗ Rethrow error so frontend shows the alert correctly
//     }
//   };


  
// //       if (!response.ok) throw new Error("Failed to upload to cloud");
  
// //       return "Upload Successful";
// //     } catch (err) {
// //       console.error("Cloud upload error:", err);
// //       return "Error uploading";
// //     }
// //   };
  
//   export default {
//     uploadToCloud,
//   };
  