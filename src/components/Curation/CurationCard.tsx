import { useState } from "react";
import ViewCuration from "../../pages/ViewCuration";

interface CurationCardProps {
  props: {
    curationCardId: number;
    theme: number;
    title: string;
    detail: string;
    photo: string;
    avgTime: number;
    feedbackCnt: number;
  };
  addEventFunc: any;
  curationAddr?: any;
}

const CurationCard = ({
  props,
  addEventFunc,
  curationAddr,
}: CurationCardProps) => {
  const {
    curationCardId,
    theme,
    title,
    detail,
    photo,
    avgTime,
    feedbackCnt,
  } = props;
  const themeList = ["π½", "βοΈ", "πΉ", "π΄π»", "π", "π€"];

  const [openViewCuration, setOpenViewCuration] = useState<boolean>(false);

  const handleViewCurationOpen = () => {
    setOpenViewCuration(true);
  };
  const handleViewCurationClose = () => {
    setOpenViewCuration(false);
  };

  return (
    <li className="curation-card" onClick={handleViewCurationOpen}>
      <ViewCuration
        open={openViewCuration}
        close={handleViewCurationClose}
        curationCard={props}
        curationAddr={curationAddr}
      />
      <div className="curation-card__info">
        <div className="curation-card__info__theme">
          <span>{`${themeList[theme]}`}</span>
        </div>
        <div className="curation-card__info__desc">
          <span className="curation-card__info__desc-title">{title}</span>
          <div className="curation-card__info__desc-summary">
            <span>{`β± ${avgTime === 0 ? 1 : avgTime}H`}</span>
            <span>{`νΌλλ°± ${feedbackCnt}κ°`}</span>
          </div>
        </div>
      </div>
      <div
        className="curation-card__add-btn"
        onClick={(e) => addEventFunc(props, e)}
      >
        β
      </div>
      <div className="curation-card__add-btn-desc">λ΄μΌμ μ μΆκ°</div>
    </li>
  );
};

export default CurationCard;
