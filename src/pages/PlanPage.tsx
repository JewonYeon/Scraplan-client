import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../reducers";
import Navbar from "../components/UI/Navbar";
import CurationList from "../components/Curation/CurationList";
import PlanList from "../components/Plan/PlanList";
import { getCurationCards, getPlanCards } from "../actions";
import Modal from "../components/UI/Modal";
import AddPlan from "../components/Plan/AddPlan";
import planReducer from "../reducers/planReducer";

declare global {
  interface Window {
    kakao: any;
  }
}

const PlanPage = () => {
  const state = useSelector((state: RootState) => state);
  const {
    userReducer: {
      user: { token, email, nickname },
    },
    planReducer: {
      planList: { isValid, isMember, planCards },
    },
  } = state;
  const dispatch = useDispatch();

  const [LatLng, setLatLng] = useState<number[]>([
    37.5139795454969,
    127.048963363388,
  ]);
  const [map, setMap] = useState<any>({});
  const [mapLevel, setMapLevel] = useState<number>(5);
  const [mapBounds, setMapBounds] = useState<object>();
  const [markerList, setMarkerList] = useState<any>([]);
  const [curationId, setCurationId] = useState<number | undefined>();
  const [planId, setPlanId] = useState<number | string | undefined>();

  const [inputKeyword, setInputKeyword] = useState<string>("");
  const [keywordList, setKeywordList] = useState<any>([]);
  const [searchMode, setSearchMode] = useState<boolean>(false);
  const [searchLatLng, setSearchLatLng] = useState<number[]>([
    37.5139795454969,
    127.048963363388,
  ]);
  const [openList, setOpenList] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<string>("");
  const [modalComment, setModalComment] = useState<string>("");
  const [openAddRequest, setOpenAddRequest] = useState<boolean>(false);
  const [viewOnlyMine, setViewOnlyMine] = useState<boolean>(false);
  const [selectTheme, setSelectTheme] = useState<number>(-1);
  const [currentDay, setCurrentDay] = useState<number>(1);

  const moveToTheNextDay = () => {
    setCurrentDay(currentDay + 1);
  };

  const moveToThePrevDay = () => {
    setCurrentDay(currentDay - 1);
  };

  const handleOpenAddRequest = () => {
    setOpenAddRequest(true);
  };

  const handleCloseAddRequest = () => {
    setOpenAddRequest(false);
  };

  const handleModalOpen = () => {
    setOpenModal(true);
  };
  const handleModalClose = () => {
    setOpenModal(false);
  };

  useEffect(() => {
    setPlanId(Number(location.pathname.split("/")[2]));
  }, []);

  // v3 스크립트를 동적으로 로드하기위해 사용한다.
  // 스크립트의 로딩이 끝나기 전에 v3의 객체에 접근하려고 하면 에러가 발생하기 때문에
  // 로딩이 끝나는 시점에 콜백을 통해 객체에 접근할 수 있도록 해 준다.
  // 비동기 통신으로 페이지에 v3를 동적으로 삽입할 경우에 주로 사용된다.
  // v3 로딩 스크립트 주소에 파라메터로 autoload=false 를 지정해 주어야 한다.

  // 주석처리해도 된다..?!
  useEffect(() => {
    window.kakao.maps.load(() => {
      loadKakaoMap();
    });
  }, [viewOnlyMine, planCards]);

  useEffect(() => {
    makeMarker();
  }, [markerList]);

  // marker request
  // 1. 지도가 이동할 때 (mapBounds의 값이 변할 때)
  // 2. 서버에 mapBounds를 보낸다.
  // 3. 응답을 받는다. => setMarkerList를 통해 마커리스트 저장
  // 4. 해당 bounds안에 마커들이 표기
  useEffect(() => {
    fetch(
      `${
        process.env.REACT_APP_SERVER_URL
      }/curations?coordinates=${encodeURIComponent(JSON.stringify(mapBounds))}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          credentials: "include",
        },
      },
    )
      .then((res) => res.json())
      .then((body) => {
        setMarkerList(body);
      })
      .catch((err) => console.error(err));
  }, [mapBounds]);

  // keyword request
  useEffect(() => {
    setSearchMode(true);
    if (inputKeyword !== "" && searchMode) {
      fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${inputKeyword}&y=${LatLng[0]}&x=${LatLng[1]}&sort=distance`,
        {
          method: "GET",
          headers: {
            Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_MAP_RESTAPI_KEY}`,
          },
        },
      )
        .then((res) => res.json())
        .then((body) => {
          let newKeywordList: object[] = [];
          body.documents.map((addr: any) => {
            newKeywordList.push({
              place_name: addr.place_name,
              address_name: addr.address_name,
            });
          });
          setKeywordList(newKeywordList);
          setSearchLatLng([body.documents[0].y, body.documents[0].x]);
        })
        .catch((err) => console.log(err));
    }
  }, [inputKeyword]);

  const handleChangeInputKeyword = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputKeyword(e.target?.value);
    },
    [inputKeyword],
  );

  const makeMarker = () => {
    for (var i = 0; i < markerList.length; i++) {
      let markerImage = new window.kakao.maps.MarkerImage(
        `/images/marker/theme0.png`,
        new window.kakao.maps.Size(54, 58),
        { offset: new window.kakao.maps.Point(20, 58) },
      );
      let position = new window.kakao.maps.LatLng(
        markerList[i].coordinates.coordinates[0],
        markerList[i].coordinates.coordinates[1],
      );
      let marker = new window.kakao.maps.Marker({
        map,
        position,
        title: markerList[i].address,
        image: markerImage,
      });

      ((marker, curationId, curationAddr) => {
        window.kakao.maps.event.addListener(marker, "click", () => {
          handleClickMarker(curationId, curationAddr);
        });
      })(marker, markerList[i].id, markerList[i].address);
      marker.setMap(map);
    }
  };

  // 맵의 변화 (drag, zoom)가 있을 때 마다
  // 중심좌표, 경계값을 구한다.
  // 위에서 useEffect로 경계값이 변할때마다 marker리스트를 계속요청하고 저장
  // -> map을 돌려 바로 리스트들을 보여줄 수 있다?
  const loadKakaoMap = () => {
    let container = document.getElementById("planpage__map");
    let options = {
      center: new window.kakao.maps.LatLng(LatLng[0], LatLng[1]),
      level: mapLevel,
    };
    // 여기서 map은 useState로 선언했었는데 또 이렇게 하신이유가 있으신가요?!
    let map = new window.kakao.maps.Map(container, options);
    setMap(map);
    // 여기까지
    let bounds = map.getBounds();
    setMapBounds([
      [bounds.qa, bounds.pa],
      [bounds.ha, bounds.oa],
    ]);

    // 내 일정만 보기인 경우
    if (viewOnlyMine) {
      //리덕스 값
      for (let i = 0; i < planCards.length; i++) {
        // 마커 만들기 (시작)
        const position = new window.kakao.maps.LatLng(
          planCards[i].coordinates[0],
          planCards[i].coordinates[1],
        );
        const marker = new window.kakao.maps.Marker({
          map,
          position,
          title: planCards[i].address,
        });
        const customOverlayContent = document.createElement("div");
        const innerOverlayContent = document.createElement("div");
        customOverlayContent.className = "customOverlay";
        innerOverlayContent.textContent = `${i + 1}`;
        customOverlayContent.append(innerOverlayContent);

        const customOverlay = new window.kakao.maps.CustomOverlay({
          position,
          content: customOverlayContent,
        });
        // 인포윈도우에 표출될 내용으로 HTML 문자열이나 document element가 가능합니다.
        // const iwContent = `<div style="padding:5px;">${planCards.planCards[i].comment}</div>`;
        const iwContent =
          "<div class='infoWindow'>" +
          `<div class='time'>${planCards[i].startTime} ~ ${planCards[i].endTime}</div>` +
          `<div class='title'>${planCards[i].comment}</div>` +
          `<div class='address'>${planCards[i].address}</div>` +
          "</div>";
        // 마커에 표시할 인포윈도우를 생성합니다
        const infowindow = new window.kakao.maps.InfoWindow({
          content: iwContent, // 인포윈도우에 표시할 내용
        });

        customOverlayContent.addEventListener("mouseover", function () {
          infowindow.open(map, marker);
        });
        customOverlayContent.addEventListener("mouseout", function () {
          infowindow.close();
        });

        marker.setMap(map);
        customOverlay.setMap(map);
        // 마커 만들기 (끝)

        // 선 만들기 (시작)
        let linePath: any = [];
        for (let i = 0; i < planCards.length; i++) {
          linePath.push(
            new window.kakao.maps.LatLng(
              planCards[i].coordinates[0],
              planCards[i].coordinates[1],
            ),
          );
        }
        const polyline = new window.kakao.maps.Polyline({
          endArrow: true,
          path: linePath, // 선을 구성하는 좌표배열 입니다
          strokeWeight: 5, // 선의 두께 입니다
          strokeColor: "red", // 선의 색깔입니다
          strokeOpacity: 0.7, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
          strokeStyle: "solid", // 선의 스타일입니다
        });
        polyline.setMap(map);
        // 선 만들기 (끝)
      }
    } else {
      // 전체 큐레이션 보기인 경우
      // drag event controller
      window.kakao.maps.event.addListener(map, "dragend", () => {
        let latlng = map.getCenter();
        setLatLng([latlng.getLat(), latlng.getLng()]);
        let bounds = map.getBounds();
        setMapBounds([
          [bounds.qa, bounds.pa],
          [bounds.ha, bounds.oa],
        ]);
        makeMarker();
      });
      // level(zoom) event controller
      let zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        let level = map.getLevel();
        setMapLevel(level);
        let bounds = map.getBounds();
        setMapBounds([
          [bounds.qa, bounds.pa],
          [bounds.ha, bounds.oa],
        ]);
        //format => ga {ha: 126.56714657186055, qa: 33.40906146511531, oa: 126.59384131033772, pa: 33.42485772749098}
      });
      makeMarker();
    }
  };

  // 지도 이동시키기
  const moveKakaoMap = (lat: number, lng: number) => {
    var moveLatLon = new window.kakao.maps.LatLng(lat, lng);
    map.panTo(moveLatLon);
    setLatLng([lat, lng]);
  };

  // 옵션과 관련된 함수들
  const handleViewOnlyMine = () => {
    alert("내 일정만 보기");
  };

  const handleFilterByTheme = (idx: number): void => {
    setSelectTheme(idx);
  };

  const handleViewState = () => {
    if (!viewOnlyMine) {
      handleViewOnlyMine();
    }
    setViewOnlyMine(!viewOnlyMine);
  };

  const handleSearchByKeyword = (): void => {
    moveKakaoMap(searchLatLng[0], searchLatLng[1]);
    setKeywordList([]);
    setInputKeyword(inputKeyword);
  };

  const handleEnterSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setSearchMode(false);
      handleSearchByKeyword();
    }
  };

  const handleEscKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setKeywordList([]);
      setInputKeyword("");
    }
  };

  const handleClickKeywordList = (addr: string) => {
    fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${addr}&y=${LatLng[0]}&x=${LatLng[1]}&sort=distance`,
      {
        method: "GET",
        headers: {
          Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_MAP_RESTAPI_KEY}`,
        },
      },
    )
      .then((res) => res.json())
      .then((body) => {
        setSearchLatLng([body.documents[0].y, body.documents[0].x]);
        moveKakaoMap(body.documents[0].y, body.documents[0].x);
      })
      .catch((err) => console.log(err));
    setInputKeyword(addr);
    setKeywordList([]);
    setSearchMode(false);
  };

  const handleClickMarker = (curationId: number, curationAddr: string) => {
    setOpenList(true);
    fetch(`${process.env.REACT_APP_SERVER_URL}/curation-cards/${curationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        credentials: "include",
      },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body) {
          dispatch(getCurationCards(body));
        } else {
        }
      })
      .catch((err) => console.error(err));
  };

  const handleAddToPlan = (props: any, e: Event) => {
    // curaton 에서 + 버튼 클릭시 plan으로 정보를 넘겨주는 함수
    e.stopPropagation();
    const {
      curationCardId,
      theme,
      title,
      detail,
      photo,
      avgTime,
      feedbackCnt,
    } = props;

    // let max = planCards.reduce((plan: any, cur: any) => {
    //   return Number(plan.endTime.split(":")[0]) * 60 +
    //     Number(plan.endTime.split(":")[1]) >
    //     Number(cur.endTime.split(":")[0]) * 60 +
    //       Number(cur.endTime.split(":")[1])
    //     ? plan
    //     : cur;
    // });
    let max = planCards.reduce(
      (plan: any, cur: any) => {
        return Number(cur.day) === Number(currentDay) &&
          Number(cur.endTime.split(":")[0]) * 60 +
            Number(cur.endTime.split(":")[1]) >
            Number(plan.endTime.split(":")[0]) * 60 +
              Number(plan.endTime.split(":")[1])
          ? cur
          : plan;
      },
      { day: currentDay, endTime: "10:00" },
    );
    console.log("maxxxxx", max);

    let endMin =
      (Number(max.endTime.split(":")[1]) +
        Number((avgTime % 1).toFixed(2)) * 100) %
      60;
    let endHour =
      Number(max.endTime.split(":")[0]) +
      Math.floor(avgTime) +
      Math.floor(
        (Number(max.endTime.split(":")[1]) +
          Number((avgTime % 1).toFixed(2)) * 100) /
          60,
      );
    dispatch(
      getPlanCards({
        isValid,
        isMember,
        planCards: planCards.concat({
          day: currentDay,
          startTime: max.endTime,
          endTime: endHour + ":" + endMin,
          comment: title,
          theme,
        }),
      }),
    );
  };

  return (
    <div className="planpage">
      <Navbar currentPage="/planpage/newpage" />
      <CurationList
        addEventFunc={handleAddToPlan}
        openList={openList}
        setOpenList={setOpenList}
      />
      <PlanList
        LatLng={LatLng}
        setSearchLatLng={setSearchLatLng}
        moveKakaoMap={moveKakaoMap}
        planId={planId}
        currentDay={currentDay}
        moveToTheNextDay={moveToTheNextDay}
        moveToThePrevDay={moveToThePrevDay}
      />
      <Modal
        open={openModal}
        close={handleModalClose}
        comment={modalComment}
        modalType={modalType}
      />
      <div className="planpage__layout">
        <div className="planpage__layout__options">
          <button
            className="planpage__layout__options__option"
            onClick={handleViewState}
          >
            {viewOnlyMine ? "👀" : "🗺"}
          </button>
          <span className="planpage__layout__options__option-desc">
            {viewOnlyMine ? "내 일정만 보기" : "전체 보기"}
          </span>
          <button
            className="planpage__layout__options__option"
            onClick={handleOpenAddRequest}
          >
            ✚
          </button>
          <span className="planpage__layout__options__option-desc-second">
            큐레이션 추가신청
          </span>
          <AddPlan
            open={openAddRequest}
            close={handleCloseAddRequest}
            type="requestCuration"
            LatLng={LatLng}
            setSearchLatLng={setSearchLatLng}
            moveKakaoMap={moveKakaoMap}
          />
          <button className="planpage__layout__options__theme">
            {selectTheme === -1
              ? "테마"
              : ["🍽", "☕️", "🕹", "🚴🏻", "🚗", "🤔"][selectTheme]}
          </button>
          <div className="planpage__layout__options__theme-list">
            <div className={`planpage__layout__options__theme-list__inner`}>
              {["All", "🍽", "☕️", "🕹", "🚴🏻", "🚗", "🤔"].map((theme, idx) => {
                return (
                  <button
                    key={idx}
                    className="planpage__layout__options__theme-list__inner__item"
                    onClick={() => handleFilterByTheme(idx - 1)}
                  >
                    {theme}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="planpage__layout__search-bar__wrapper">
          <div className="planpage__layout__search-bar">
            <input
              type="text"
              placeholder="지역 검색"
              value={inputKeyword}
              onChange={handleChangeInputKeyword}
              onKeyPress={handleEnterSearch}
              onKeyDown={handleEscKey}
            ></input>
            <button onClick={handleSearchByKeyword}>🔍</button>
          </div>
          {keywordList.length !== 0 ? (
            <ul>
              {keywordList.map((addr: any, idx: number) => {
                return (
                  <li
                    key={idx}
                    onClick={() => handleClickKeywordList(addr.place_name)}
                  >
                    <div className="place_name">{`👉🏻  ${addr.place_name}`}</div>
                    <div className="address_name">{addr.address_name}</div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div id="planpage__map"></div>
    </div>
  );
};

export default PlanPage;
