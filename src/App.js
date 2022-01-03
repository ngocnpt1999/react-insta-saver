import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';
import './App.css';
import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import axios from 'axios';

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

  useEffect(() => {
    if (status.isLoading) {
      showModal("loadingModal");
    } else {
      hideModal("loadingModal");
    }
  }, [status.isLoading]);

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
    setPhotoBag({
      enable: false,
      photos: []
    });
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

  const downloadPhotoBag = () => {
    setStatus({ ...status, isLoading: true });
    axios({
      method: "POST",
      url: `${apiDomain}/media/compressed`,
      data: {
        id: igUser.id,
        username: igUser.username,
        photos: photoBag.photos
      },
      responseType: 'blob'
    }).then((response) => {
      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${igUser.id}_${Math.floor(Math.random() * 1000000000)}.zip`); //or any other extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(response.statusText);
      }
    }).then(() => {
      setPhotoBag({
        enable: false,
        photos: []
      })
    })
      .catch((err) => setStatus({ ...status, error: err.message }))
      .finally(() => setStatus({ ...status, isLoading: false }));
  }

  return (
    <div className="container-fluid px-0 px-md-3">
      <div className="mx-auto my-4 px-2" style={{ maxWidth: "568px" }}>
        <div className="input-group mb-3">
          <input type="text" className="form-control" value={username} placeholder="@username" onChange={handleChange}></input>
          <button className="btn btn-danger" type="button" onClick={getIgUser}>Confirm</button>
        </div>
        {
          status.error !== "" ?
            <h3 className="text-danger">{status.error}</h3>
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
      </div>
      <br></br>
      {
        igUser !== null ?
          <div className='position-fixed bottom-0 end-0 p-3'>
            {
              photoBag.photos.length > 0 ?
                <button onClick={downloadPhotoBag} className='btn btn-success rounded-circle p-0 me-2'>
                  <i className="fas fa-save fa-2x"></i>
                </button> : null
            }
            {
              !photoBag.enable ?
                <button onClick={enablePhotoBag} className='btn btn-primary rounded-circle p-0'>
                  <i className="fas fa-check fa-2x"></i>
                </button> :
                <button onClick={enablePhotoBag} className='btn btn-danger rounded-circle p-0'>
                  <i className="fas fa-times fa-2x"></i>
                </button>
            }
          </div> : null
      }
      <div className='modal fade bg-dark bg-opacity-75' id='photoModal'>
        <div className='modal-dialog modal-fullscreen modal-dialog-centered'>
          <div className='modal-body p-0'>
            <img alt='' src='' id='imgModal' className='img-fluid d-block mx-auto' style={{ maxHeight: "95vh" }}></img>
          </div>
        </div>
      </div>
      <div className='modal fade bg-dark bg-opacity-75' id='loadingModal' data-bs-backdrop="static" data-bs-keyboard="false">
        <div className='modal-dialog modal-fullscreen modal-dialog-centered'>
          <div className='modal-body p-0'>
            <div className="d-flex justify-content-center">
              <div className="spinner-grow text-danger justify-content-center" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <strong className="justify-content-center align-self-center text-light ms-1">Loading...</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const showModal = (id) => {
  var myModalEl = document.getElementById(id);
  var modal = bootstrap.Modal.getOrCreateInstance(myModalEl);
  modal.show();
}

const hideModal = (id) => {
  var myModalEl = document.getElementById(id);
  var modal = bootstrap.Modal.getOrCreateInstance(myModalEl);
  modal.hide();
}

const IgUserPhotos = (props) => {
  const { photos, photoBag, onCheck } = props;

  const showImg = (e) => {
    var url = e.target.src;
    document.getElementById("imgModal").src = url;
    showModal("photoModal");
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
      var checkbox = element.querySelector('input');
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
                  className={photoBag.photos.includes(photo) ? "border border-2 border-primary" : ""}
                ></img>
                {
                  photoBag.enable ?
                    <div className='position-absolute' onClick={handleCheck}>
                      <div className="form-check d-flex justify-content-end">
                        <input className="form-check-input rounded-circle border-primary shadow mt-2 me-2"
                          type="checkbox"
                          value={photo}
                          checked={photoBag.photos.includes(photo)}
                          onChange={handleCheck}
                          style={{ width: "1.25rem", height: "1.25rem" }}
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
