import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../reducers";
import { getPlanCards, getPlanCardsByDay } from "../../actions";
import RGL, { WidthProvider } from "react-grid-layout";
import SetTime from "../UI/SetTime";
import SetTheme from "../UI/SetTheme";
import "./PlanTimeline.scss";
import "./Plan.scss";

const ReactGridLayout = WidthProvider(RGL);

const PlanTimeline = ({
  day,
  handleSavePlanBtn,
  filterByDay,
  setFilterByDay,
  oneDayPlanList,
}) => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state);
  const {
    userReducer: {
      user: { token, email, nickname },
    },
    planReducer: {
      planList: { isValid, isMember, planCards },
      planCardsByDay,
    },
  } = state;

  const [layoutState, setLayoutState] = useState([]);

  // 초기 레이아웃 생성
  useEffect(() => {
    setLayoutState(generateLayout());
  }, [planCardsByDay]);

  const generateLayout = () => {
    if (
      planCardsByDay &&
      planCardsByDay[day - 1] &&
      planCardsByDay[day - 1].length > 0
    ) {
      return planCardsByDay[day - 1].map((plancard, idx) => {
        const { startTime, endTime } = plancard;
        const startHour = Number(startTime.split(":")[0]);
        const startMin = Number(startTime.split(":")[1]);
        const endHour = Number(endTime.split(":")[0]);
        const endMin = Number(endTime.split(":")[1]);
        return {
          w: 1,
          x: 0,
          h: endHour * 4 + endMin / 15 - startHour * 4 - startMin / 15, // 높이
          y: startHour * 4 + startMin / 15, // 위치
          maxH: 24,
          i: idx.toString(),
          moved: false,
          static: false,
        };
      });
    }
  };

  const onLayoutChange = (layout) => {
    if (
      layoutState &&
      layoutState.length !== 0 &&
      planCardsByDay &&
      planCardsByDay[day - 1] &&
      layout &&
      layout.length !== 0 &&
      layout.length === planCardsByDay[day - 1].length
    ) {
      // 시간 변환
      let newPlanCardsList = planCardsByDay[day - 1].map((plan, idx) => {
        let startHour = Math.floor(layout[idx].y / 4);
        let startMin =
          (layout[idx].y % 4) * 15 === 0 ? "00" : (layout[idx].y % 4) * 15;
        let endHour = Math.floor((layout[idx].y + layout[idx].h) / 4);
        let endMin =
          ((layout[idx].y + layout[idx].h) % 4) * 15 === 0
            ? "00"
            : ((layout[idx].y + layout[idx].h) % 4) * 15;
        let newPlan = Object.assign({}, plan, {
          startTime: startHour + ":" + startMin,
          endTime: endHour + ":" + endMin,
        });
        return newPlan;
      });
      dispatch(
        getPlanCardsByDay([
          ...planCardsByDay.slice(0, day - 1),
          newPlanCardsList,
          ...planCardsByDay.slice(day),
        ]),
      );
    }
  };

  return (
    <ReactGridLayout
      id="plantimeline"
      layout={generateLayout() || layoutState}
      onLayoutChange={(layout) => onLayoutChange(layout)}
      {...{
        isDraggable: true,
        isResizable: true,
        items: planCardsByDay.length ? planCardsByDay[day - 1].length : 1,
        rowHeight: 28,
        cols: 1,
        rows: 96,
        compactType: null,
        preventCollision: true,
        transformScale: 1,
        width: 270,
      }}
    >
      {planCardsByDay &&
        planCardsByDay[day - 1] &&
        planCardsByDay[day - 1].map((plancard, idx) => {
          const {
            day,
            startTime,
            endTime,
            comment,
            theme,
            coordinates,
            address,
          } = plancard;

          // const handleChangeTheme = (themeIndex, cardIdx) => {
          //   planCardsByDay[day - 1][cardIdx].theme = themeIndex;
          //   dispatch(getPlanCardsByDay([...planCardsByDay]));
          // };

          const handleDeletePlancard = (e, cardIdx) => {
            dispatch(
              getPlanCardsByDay([
                ...planCardsByDay.slice(0, day - 1),
                planCardsByDay[day - 1].filter((card, idx) => {
                  return idx !== cardIdx;
                }),
                ...planCardsByDay.slice(day),
              ]),
            );
          };
          return (
            <div className="plancard" key={idx}>
              {/* <SetTheme
                themeIndex={theme}
                giveThemeIndexToParent={(themeIndex) =>
                  handleChangeTheme(themeIndex, idx)
                }
                readonly={true}
              /> */}
              <div className="set-theme">
                <div className="set-theme__img">
                  <div>{["🍽", "☕️", "🕹", "🚴🏻", "🚗", "🤔"][theme]}</div>
                </div>
              </div>
              <SetTime
                startTime={startTime}
                endTime={endTime}
                readonly={true}
              />
              <div className="plancard__title">{comment}</div>
              <div className="plancard__address">{address}</div>
              <button
                className="plancard__delete-btn"
                onClick={(e) => handleDeletePlancard(e, idx)}
              >
                삭제
              </button>
            </div>
          );
        })}
    </ReactGridLayout>
  );
};
export default PlanTimeline;
