import React, { useState } from "react";

const SearchForm = (props: { getData: any; isOnLoading: boolean }) => {
  const { getData, isOnLoading } = props;
  const [keyword, setKeyword] = useState("");
  return (
    <div className={isOnLoading ? "form disable" : "form"}>
      <input
        type="text"
        className="form-text"
        disabled={isOnLoading ? true : false}
        onChange={(e: any) => {
          setKeyword(e.target.value);
        }}
        onKeyPress={(e: any) => {
          if (e.charCode === 13) {
            if (keyword) {
              getData(keyword);
            }
          }
        }}
      />
      <button
        type="button"
        className="form-btn"
        disabled={isOnLoading ? true : false}
        onClick={() => {
          if (keyword) {
            getData(keyword);
          }
        }}
      >
        search
      </button>
    </div>
  );
};

export default SearchForm;