import React from "react";
import SearchItem from "./SearchItem";

const SearchList = (props: { searchData: []; isOnLoading: boolean }) => {
  const { searchData, isOnLoading } = props;
  return (
    <div className={isOnLoading ? "card-list disable" : "card-list"}>
      {searchData.map(
        (item: any, idx: number): JSX.Element => {
          if (item.kategorie && item.kategorie && item.text) {
            return <SearchItem key={idx} item={item} />;
          } else {
            return (
              <div key={idx} className="none">
                검색결과 없음
              </div>
            );
          }
        }
      )}
    </div>
  );
};

export default SearchList;