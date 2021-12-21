import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

const App = () => {
  const [username, setUsername] = useState("");
  const [igUser, setIgUser] = useState(null);
  const [status, setStatus] = useState({
    isLoading: false,
    error: ""
  });

  const handleChange = (e) => {
    setUsername(e.target.value);
  }

  const getIgUser = () => {
    setIgUser(null);
    setStatus({ ...status, isLoading: true });
    fetch(`https://treechoweather.azurewebsites.net/api/ig?username=${username}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw new Error(response.statusText);
        }
      })
      .then((user) => {
        setStatus({
          isLoading: false,
          error: ""
        });
        setIgUser(user);
      })
      .catch((err) => {
        setStatus({
          isLoading: false,
          error: err
        });
      });
  }

  const loadMore = () => {
    fetch(`https://treechoweather.azurewebsites.net/api/ig?username=${igUser.username}&next=${igUser.next}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw new Error(response.statusText);
        }
      })
      .then((user) => {
        user.photos = igUser.photos.concat(user.photos);
        setIgUser(user);
        setStatus({ ...status, error: "" });
      })
      .catch((err) => setStatus({ ...status, error: err }));
  }

  return (
    <div className="container-fluid px-0 px-md-3">
      <div className="w-50 mx-auto my-4">
        <div className="input-group mb-3">
          <input type="text" className="form-control" value={username} placeholder="@username" onChange={handleChange}></input>
          <button className="btn btn-outline-secondary" type="button" onClick={getIgUser}>Submit</button>
        </div>
        {
          status.isLoading ?
            <div className="d-flex">
              <div className="spinner-grow text-danger" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <strong className="justify-content-center align-self-center ms-1">Loading...</strong>
            </div>
            : null
        }
      </div>
      <div className="mx-auto" style={{ maxWidth: "960px" }}>
        {
          igUser === null ? null :
            <InfiniteScroll
              dataLength={igUser.photos.length}
              next={loadMore}
              hasMore={igUser.next !== "" ? true : false}
              loader={
                <div className="d-flex justify-content-center my-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              }
              style={{ overflow: "unset" }}
            >
              <IgUserPhotos photos={igUser.photos}></IgUserPhotos>
            </InfiniteScroll>
        }
        {
          status.error !== "" ?
            <h3 className="text-danger">{status.error}</h3>
            : null
        }
      </div>
      <br></br>
      <div className='modal fade bg-dark bg-opacity-75' id='myModal'>
        <div className='modal-dialog modal-fullscreen modal-dialog-centered'>
          <div className='modal-body p-0'>
            <img alt='' src='' id='imgModal' className='img-fluid mx-auto d-block' style={{ maxHeight: "90vh" }}></img>
          </div>
        </div>
      </div>
    </div>
  );
}

const IgUserPhotos = (props) => {
  const { photos } = props;

  const imgClick = (e) => {
    var url = e.target.src;
    document.getElementById("imgModal").src = url;
    var modal = new bootstrap.Modal(document.getElementById("myModal"), { backdrop: true });
    modal.show();
  }

  return (
    <div className="row row-cols-3 g-1 g-md-3 g-lg-4">
      {
        photos.map((photo, index) => {
          var image = `https://treechoweather.azurewebsites.net/api/media?url=${encodeURIComponent(photo)}`;
          return (
            <div key={index} className='col'>
              <div className="rounded ratio ratio-1x1">
                <img src={image} alt='' style={{ objectFit: "cover" }} onClick={imgClick} loading={index < 24 ? "eager" : "lazy"}></img>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

export default App;
