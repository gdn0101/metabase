import React, { useState, useRef } from "react";
import { t } from "ttag";

import _ from "underscore";

import { CardApi } from "metabase/services";

import * as Queries from "../../audit_app/lib/cards/queries";
import AuditTable from "../../audit_app/containers/AuditTable";
import AuditParameters from "../../audit_app/components/AuditParameters";
import { ErrorMode } from "../mode";

const getSortOrder = isAscending => (isAscending ? "asc" : "desc");

const CARD_ID_COL = 0;

export default function ErrorOverview(props) {
  const reloadRef = useRef(null);
  // TODO: use isReloading to display a loading overlay
  // eslint-disable-next-line no-unused-vars
  const [isReloading, setIsReloading] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [sorting, setSorting] = useState({
    column: "last_run_at",
    isAscending: false,
  });

  const [rowChecked, setRowChecked] = useState({});
  const [rowFilter, setRowFilter] = useState({});
  const [rowToCardId, setRowToCardId] = useState({});

  const handleAllSelectClick = e => {
    const newRowChecked = rowChecked;
    const newRowToCardId = rowToCardId;
    const noRowChecked = Object.values(rowChecked).every(v => !v);
    for (const rowIndex of Array(e.rows.length).keys()) {
      if (noRowChecked) {
        newRowChecked[rowIndex] = true;
        newRowToCardId[rowIndex] = e.rows[rowIndex][CARD_ID_COL];
      } else {
        newRowChecked[rowIndex] = false;
        newRowToCardId[rowIndex] = null;
      }
    }
    setRowChecked(newRowChecked);
    setRowToCardId(newRowToCardId);
  };

  const handleRowSelectClick = e => {
    const newRowChecked = rowChecked;
    const newRowToCardId = rowToCardId;
    newRowChecked[e.rowIndex] = !(rowChecked[e.rowIndex] || false);
    newRowToCardId[e.rowIndex] = e.row[CARD_ID_COL];
    setRowChecked(newRowChecked);
    setRowToCardId(newRowToCardId);
  };

  const handleReloadSelected = async () => {
    setIsReloading(true);
    const checkedCardIds = Object.values(
      _.pick(rowToCardId, (member, key) => rowChecked[key]),
    );
    checkedCardIds.map(async member => await CardApi.query({ cardId: member })),
      setRowFilter(rowChecked);
    setRowChecked({});
  };

  const handleSortingChange = sorting => setSorting(sorting);

  const handleLoad = result => {
    setHasResults(result[0].row_count !== 0);
    setIsReloading(false);
  };

  return (
    <AuditParameters
      parameters={[
        { key: "errorFilter", placeholder: t`Error contents` },
        { key: "dbFilter", placeholder: t`DB name` },
        { key: "collectionFilter", placeholder: t`Collection name` },
      ]}
      buttons={[
        {
          key: "reloadSelected",
          label: t`Rerun Selected`,
          onClick: handleReloadSelected,
        },
      ]}
      hasResults={hasResults}
    >
      {({ errorFilter, dbFilter, collectionFilter }) => (
        <AuditTable
          {...props}
          reloadRef={reloadRef}
          pageSize={50}
          isSortable
          isSelectable
          rowChecked={rowChecked}
          rowFilter={rowFilter}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          onAllSelectClick={handleAllSelectClick}
          onRowSelectClick={handleRowSelectClick}
          onLoad={handleLoad}
          mode={ErrorMode}
          table={Queries.bad_table(
            errorFilter,
            dbFilter,
            collectionFilter,
            sorting.column,
            getSortOrder(sorting.isAscending),
          )}
          className={"bounded-overflow-x-scroll"}
        />
      )}
    </AuditParameters>
  );
}
