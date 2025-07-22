import './imageContainer.css';

export default function ImageContainer({ imageObjects }) {
  return (
    <div className='images-container'>
      {imageObjects.map(image => (
        <img src={image.publicUrl} alt={image.name} className='image' key={image.name} />
      ))}
    </div>
  );
}