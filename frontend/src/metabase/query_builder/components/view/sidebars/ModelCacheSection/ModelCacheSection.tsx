import React from "react";
import { t } from "ttag";
import moment from "moment";
import { connect } from "react-redux";

import PersistedModels from "metabase/entities/persisted-models";

import Question from "metabase-lib/lib/Question";
import { ModelCacheRefreshStatus } from "metabase-types/api";

import {
  Row,
  StatusContainer,
  StatusLabel,
  LastRefreshTimeLabel,
  IconButton,
  ErrorIcon,
  RefreshIcon,
} from "./ModelCacheSection.styled";

type Props = {
  model: Question;
  onRefresh: (job: ModelCacheRefreshStatus) => void;
};

type LoaderRenderProps = {
  persistedModel: ModelCacheRefreshStatus;
};

function getStatusMessage(job: ModelCacheRefreshStatus) {
  if (job.state === "error") {
    return t`Failed to update model cache`;
  }
  if (job.state === "refreshing") {
    return t`Refreshing model cache`;
  }
  const lastRefreshTime = moment(job.refresh_end).fromNow();
  return t`Model last cached ${lastRefreshTime}`;
}

const mapDispatchToProps = {
  onRefresh: (job: ModelCacheRefreshStatus) =>
    PersistedModels.objectActions.refreshCache(job),
};

function ModelCacheSection({ model, onRefresh }: Props) {
  return (
    <PersistedModels.Loader
      id={model.id()}
      entityQuery={{ type: "byModelId" }}
      selectorName="getByModelId"
      loadingAndErrorWrapper={false}
    >
      {({ persistedModel }: LoaderRenderProps) => {
        if (!persistedModel) {
          return null;
        }

        const isError = persistedModel.state === "error";
        const lastRefreshTime = moment(persistedModel.refresh_end).fromNow();

        return (
          <Row>
            <div>
              <StatusContainer>
                <StatusLabel>{getStatusMessage(persistedModel)}</StatusLabel>
                {isError && <ErrorIcon name="warning" size={14} />}
              </StatusContainer>
              {isError && (
                <LastRefreshTimeLabel>
                  {t`Last attempt ${lastRefreshTime}`}
                </LastRefreshTimeLabel>
              )}
            </div>
            <IconButton onClick={() => onRefresh(persistedModel)}>
              <RefreshIcon name="refresh" tooltip={t`Refresh now`} size={14} />
            </IconButton>
          </Row>
        );
      }}
    </PersistedModels.Loader>
  );
}

export default connect(null, mapDispatchToProps)(ModelCacheSection);
