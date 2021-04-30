import React from "react";

const SearchLoading = (props: { isOnLoading: boolean }) => {
  const { isOnLoading } = props;
  return (
    <div className={isOnLoading ? "loading on" : "loading"}>loading..</div>
  );
};

export default SearchLoading;
