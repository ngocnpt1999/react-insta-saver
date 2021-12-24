import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css';
import { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

let apiDomain = "https://treechoapi.azurewebsites.net/api";

const App = () => {
  const [username, setUsername] = useState("");
  const [igUser, setIgUser] = useState(null);
  const [status, setStatus] = useState({
    isLoading: false,
    error: ""
  });
  const [photoBag, setPhotoBag] = useState({
    enable: false,
    photos: []
  });

  const enablePhotoBag = () => {
    if (photoBag.enable) {
      setPhotoBag({
        enable: false,
        photos: []
      });
    }
    else {
      setPhotoBag({ ...photoBag, enable: true });
    }
  }

  const updatePhotoInBag = (url) => {
    var index = photoBag.photos.indexOf(url);
    var tempPhotos = photoBag.photos.slice();
    if (index > -1) {
      tempPhotos.splice(index, 1);
    }
    else {
      tempPhotos.push(url);
    }
    setPhotoBag({ ...photoBag, photos: tempPhotos });
  }

  const handleChange = (e) => {
    setUsername(e.target.value);
  }

  const getIgUser = () => {
    setIgUser(null);
    setStatus({ ...status, isLoading: true });
    fetch(`${apiDomain}/ig?username=${username}`)
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
        if (user !== null || user !== undefined) {
          setIgUser(user);
        }
      })
      .catch((err) => {
        setStatus({
          isLoading: false,
          error: err.message
        });
      });
  }

  const loadMore = () => {
    fetch(`${apiDomain}/ig?username=${igUser.username}&next=${igUser.next}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        else {
          throw new Error(response.statusText);
        }
      })
      .then((user) => {
        if (user !== null || user !== undefined) {
          user.photos = igUser.photos.concat(user.photos);
          setIgUser(user);
          setStatus({
            isLoading: false,
            error: ""
          });
        }
      })
      .catch((err) => {
        setStatus({
          isLoading: false,
          error: err.message
        });
      });
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
              <IgUserPhotos photos={igUser.photos} photoBag={photoBag} onCheck={updatePhotoInBag}></IgUserPhotos>
            </InfiniteScroll>
        }
        {
          status.error !== "" ?
            <h3 className="text-danger">{status.error}</h3>
            : null
        }
      </div>
      <br></br>
      <div className='position-fixed bottom-0 end-0'>
        {
          photoBag.photos.length > 0 ?
            <button className='btn btn-primary me-1 mb-3'>
              <i className="fas fa-download fa-2x"></i>
            </button> : null
        }
        {
          !photoBag.enable ?
            <button onClick={enablePhotoBag} className='btn btn-primary me-3 mb-3'>
              <i className="fas fa-tasks fa-2x"></i>
            </button> :
            <button onClick={enablePhotoBag} className='btn btn-danger me-3 mb-3'>
              <i className="fas fa-times-circle fa-2x"></i>
            </button>
        }
      </div>
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
  const { photos, photoBag, onCheck } = props;

  const showImg = (e) => {
    var url = e.target.src;
    document.getElementById("imgModal").src = url;
    var modal = new bootstrap.Modal(document.getElementById("myModal"), { backdrop: true });
    modal.show();
  }

  const downloadImg = (e) => {
    var url = e.target.value;
    var a = document.createElement("a");
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const handleCheck = (e) => {
    var element = e.currentTarget;
    var url;
    if (element.type === "checkbox") {
      url = element.value;
      onCheck(url);
    }
    else {
      var checkbox = e.target.querySelector('input');
      url = checkbox.value;
      onCheck(url);
    }
  }

  return (
    <div className="row row-cols-3 g-1 g-md-3 g-lg-4">
      {
        photos.map((photo, index) => {
          var imgUrl = `${apiDomain}/media?fbUrl=${encodeURIComponent(photo)}`;
          return (
            <div key={index} className='col'>
              <div className="ratio ratio-1x1">
                <img src={imgUrl}
                  alt='' style={{ objectFit: "cover" }}
                  onClick={showImg}
                  loading={index < 24 ? "eager" : "lazy"}
                ></img>
                {
                  photoBag.enable ?
                    <div className='position-absolute' onClick={handleCheck}>
                      <div className="form-check d-flex justify-content-end">
                        <input className="form-check-input border-primary shadow mt-2 me-2"
                          type="checkbox"
                          value={photo}
                          checked={photoBag.photos.includes(photo)}
                          onChange={handleCheck}
                          style={{ minHeight: "1.5rem", minWidth: "1.5rem" }}
                        ></input>
                      </div>
                    </div> :
                    <div className='position-absolute top-85 start-50 translate-middle-x h-15 w-75'>
                      <button value={imgUrl + "&download=true"}
                        className='btn shadow h4 fw-bold h-100 w-100'
                        onClick={downloadImg}
                      >DOWNLOAD</button>
                    </div>
                }
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

export default App;
